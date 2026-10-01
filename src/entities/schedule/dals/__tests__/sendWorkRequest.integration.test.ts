import { randomUUID } from "node:crypto";
import { DomainError } from "@/shared/api/errors";
import { sendWorkRequest } from "@/entities/schedule/dals/send-work-request";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  kstDate,
  kstMonthStart,
  seedAssignment,
  withFreshMonth,
  type AdminUser,
} from "@tests/integration/postgres";

type RpcCaller = { client: AdminUser["client"] };

function rpc(
  user: RpcCaller,
  fn: string,
  args: Record<string, unknown>,
): Promise<{ error: { message: string } | null }> {
  return (
    user.client as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
    }
  ).rpc(fn, args);
}

async function rpcOrThrow(
  user: RpcCaller,
  fn: string,
  args: Record<string, unknown>,
): Promise<void> {
  const { error } = await rpc(user, fn, args);
  if (error) {
    throw new Error(error.message);
  }
}

async function captureDomainError(
  run: () => Promise<unknown>,
): Promise<DomainError> {
  try {
    await run();
  } catch (error) {
    if (error instanceof DomainError) {
      return error;
    }
    throw error;
  }
  throw new Error("에러가 나지 않았다");
}

async function seedOpenDay(
  admin: AdminUser,
): Promise<{ dayId: string; workDate: string }> {
  return withFreshMonth(async (monthsFromNow) => {
    const workDate = kstMonthStart(monthsFromNow);
    await rpcOrThrow(admin, "create_schedule", {
      p_month: workDate,
      p_deadline: kstDate(1),
    });
    await rpcOrThrow(admin, "open_day", { p_work_date: workDate });

    const { data, error } = await admin.client
      .from("days")
      .select("id")
      .eq("work_date", workDate)
      .single<{ id: string }>();
    if (error || !data) {
      throw error ?? new Error("연 날을 못 찾았다");
    }
    return { dayId: data.id, workDate };
  });
}

type SlotRow = { id: string; positions: string[] };

async function slotsForDay(
  admin: AdminUser,
  dayId: string,
): Promise<SlotRow[]> {
  const { data, error } = await admin.client
    .from("slots")
    .select("id, positions")
    .eq("day_id", dayId)
    .is("ended_at", null);
  if (error) {
    throw error;
  }
  return (data ?? []) as SlotRow[];
}

async function slotIdForPosition(
  admin: AdminUser,
  dayId: string,
  position: string,
  index = 0,
): Promise<string> {
  const slots = await slotsForDay(admin, dayId);
  const matches = slots.filter(
    (slot) => slot.positions.length === 1 && slot.positions[0] === position,
  );
  const found = matches[index];
  if (!found) {
    throw new Error(`${position} 자리를 못 찾았다`);
  }
  return found.id;
}

function positionsLiteral(positions: string[]): string {
  return `{${positions.map((position) => `"${position}"`).join(",")}}`;
}

/**
 * 임의 날짜에 날 하나와 자리 하나를 직접 심는다 — `open_day`·`create_schedule`은 지난
 * 날짜를 막거나 이미 있는 달·날짜에 `already_exists`·`already_open`을 던져서, 재실행에도
 * 안전하게 같은 날짜를 다시 쓰려면 직접 심어야 한다(`seedDayEndedHoursAgo`와 같은 결).
 */
function seedDayWithSlot(
  admin: AdminUser,
  workDate: string,
  startsAt: string,
  endsAt: string,
  position: string,
): { slotId: string; dayId: string } {
  const month = `${workDate.slice(0, 7)}-01`;
  const dayId = randomUUID();
  const slotId = randomUUID();

  execSql(
    [
      "delete from public.days where work_date = :'work_date';",
      "insert into public.schedules (month, created_by) values (:'month', :'created_by') on conflict (month) do nothing;",
      "insert into public.days (id, schedule_id, work_date, starts_at, ends_at, opened_by)",
      "select :'day_id', id, :'work_date', :'starts_at', :'ends_at', :'created_by' from public.schedules where month = :'month';",
      `insert into public.slots (id, day_id, positions) values (:'slot_id', :'day_id', '${positionsLiteral([position])}');`,
    ].join("\n") + "\n",
    {
      month,
      created_by: admin.profileId,
      work_date: workDate,
      starts_at: startsAt,
      ends_at: endsAt,
      day_id: dayId,
      slot_id: slotId,
    },
  );

  return { slotId, dayId };
}

type RequestRow = {
  id: string;
  slot_id: string | null;
  closed_at: string | null;
  expires_at: string;
};

async function requestForSlot(
  admin: AdminUser,
  slotId: string,
): Promise<RequestRow | null> {
  const { data, error } = await admin.client
    .from("requests")
    .select("id, slot_id, closed_at, expires_at")
    .eq("slot_id", slotId)
    .is("closed_at", null)
    .maybeSingle<RequestRow>();
  if (error) {
    throw error;
  }
  return data;
}

type CandidateRow = {
  profile_id: string;
  status: string;
  responded_at: string | null;
  expires_at: string;
};

async function candidatesFor(
  admin: AdminUser,
  requestId: string,
): Promise<CandidateRow[]> {
  const { data, error } = await admin.client
    .from("request_candidates")
    .select("profile_id, status, responded_at, expires_at")
    .eq("request_id", requestId);
  if (error) {
    throw error;
  }
  return (data ?? []) as CandidateRow[];
}

describe("sendWorkRequest dal — send_work_request을 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("관리자가 아니면 not_allowed", async () => {
    const worker = await createApprovedUser();

    const error = await captureDomainError(() =>
      sendWorkRequest(worker.client, randomUUID(), [randomUUID()]),
    );

    expect(error.code).toBe("not_allowed");
  });

  it("보내면 requests 한 행과 request_candidates가 전부 pending으로 선다", async () => {
    const { dayId } = await seedOpenDay(admin);
    const candidateA = await createApprovedUser();
    const candidateB = await createApprovedUser();
    const slotId = await slotIdForPosition(admin, dayId, "안내", 0);

    const requestId = await sendWorkRequest(admin.client, slotId, [
      candidateA.profileId,
      candidateB.profileId,
    ]);

    const request = await requestForSlot(admin, slotId);
    expect(request?.id).toBe(requestId);
    expect(request?.closed_at).toBeNull();

    const candidates = await candidatesFor(admin, requestId);
    const byProfile = new Map(candidates.map((row) => [row.profile_id, row]));
    expect(byProfile.get(candidateA.profileId)?.status).toBe("pending");
    expect(byProfile.get(candidateB.profileId)?.status).toBe("pending");
  });

  it("자리가 이미 찼으면 slot_full", async () => {
    const { dayId, workDate } = await seedOpenDay(admin);
    const occupant = await createApprovedUser();
    await rpcOrThrow(occupant, "submit_availability", {
      p_month: `${workDate.slice(0, 7)}-01`,
      p_dates: [workDate],
    });
    const slotId = await slotIdForPosition(admin, dayId, "대기실");
    seedAssignment(dayId, occupant.profileId, "regular", slotId);

    const candidate = await createApprovedUser();

    const error = await captureDomainError(() =>
      sendWorkRequest(admin.client, slotId, [candidate.profileId]),
    );

    expect(error.code).toBe("slot_full");
  });

  it("근무 시작이 지난 날이면 window_closed", async () => {
    const { slotId } = seedDayWithSlot(
      admin,
      kstDate(-1),
      "09:00:00",
      "18:00:00",
      "안내",
    );
    const candidate = await createApprovedUser();

    const error = await captureDomainError(() =>
      sendWorkRequest(admin.client, slotId, [candidate.profileId]),
    );

    expect(error.code).toBe("window_closed");
  });

  it("그날 이미 다른 자리에 든 사람은 조용히 빼고 나머지만 넣는다", async () => {
    const { dayId } = await seedOpenDay(admin);
    const alreadyAssigned = await createApprovedUser();
    const managerSlotId = await slotIdForPosition(admin, dayId, "매니저", 0);
    seedAssignment(dayId, alreadyAssigned.profileId, "regular", managerSlotId);

    const freshCandidate = await createApprovedUser();
    const targetSlotId = await slotIdForPosition(admin, dayId, "축가");

    const requestId = await sendWorkRequest(admin.client, targetSlotId, [
      alreadyAssigned.profileId,
      freshCandidate.profileId,
    ]);

    const candidates = await candidatesFor(admin, requestId);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.profile_id).toBe(freshCandidate.profileId);
  });

  it("같은 자리에 살아 있는 요청이 있으면 새 요청 대신 후보만 더한다", async () => {
    const { dayId } = await seedOpenDay(admin);
    const slotId = await slotIdForPosition(admin, dayId, "매니저", 0);
    const candidateA = await createApprovedUser();
    const candidateB = await createApprovedUser();

    const firstRequestId = await sendWorkRequest(admin.client, slotId, [
      candidateA.profileId,
    ]);
    const secondRequestId = await sendWorkRequest(admin.client, slotId, [
      candidateB.profileId,
    ]);

    expect(secondRequestId).toBe(firstRequestId);
    const candidates = await candidatesFor(admin, firstRequestId);
    expect(candidates.map((row) => row.profile_id).sort()).toEqual(
      [candidateA.profileId, candidateB.profileId].sort(),
    );

    const { data: liveRequests, error } = await admin.client
      .from("requests")
      .select("id")
      .eq("slot_id", slotId)
      .is("closed_at", null);
    if (error) {
      throw error;
    }
    expect(liveRequests).toHaveLength(1);
  });

  it("거절된 후보를 다시 고르면 pending으로 되돌리고 만료를 갱신한다", async () => {
    const { dayId } = await seedOpenDay(admin);
    const slotId = await slotIdForPosition(admin, dayId, "매니저", 1);
    const candidateA = await createApprovedUser();
    const candidateB = await createApprovedUser();

    const requestId = await sendWorkRequest(admin.client, slotId, [
      candidateA.profileId,
      candidateB.profileId,
    ]);

    execSql(
      "update public.request_candidates set status = 'declined', responded_at = now() where request_id = :'request_id' and profile_id = :'profile_id';\n",
      { request_id: requestId, profile_id: candidateA.profileId },
    );

    const againRequestId = await sendWorkRequest(admin.client, slotId, [
      candidateA.profileId,
    ]);
    expect(againRequestId).toBe(requestId);

    const candidates = await candidatesFor(admin, requestId);
    const revived = candidates.find(
      (row) => row.profile_id === candidateA.profileId,
    );
    expect(revived?.status).toBe("pending");
    expect(revived?.responded_at).toBeNull();
  });

  it("근무 시작이 48시간보다 멀면 expires_at은 now() + 48시간이다", async () => {
    const { dayId } = await seedOpenDay(admin);
    const slotId = await slotIdForPosition(admin, dayId, "안내", 1);
    const candidate = await createApprovedUser();

    const before = Date.now();
    const requestId = await sendWorkRequest(admin.client, slotId, [
      candidate.profileId,
    ]);
    const after = Date.now();

    const request = await requestForSlot(admin, slotId);
    expect(request?.id).toBe(requestId);
    const expiresAtMs = new Date(request!.expires_at).getTime();
    const expectedMin = before + 48 * 3600 * 1000;
    const expectedMax = after + 48 * 3600 * 1000;
    expect(expiresAtMs).toBeGreaterThanOrEqual(expectedMin - 5000);
    expect(expiresAtMs).toBeLessThanOrEqual(expectedMax + 5000);

    const candidates = await candidatesFor(admin, requestId);
    expect(new Date(candidates[0]!.expires_at).getTime()).toBe(expiresAtMs);
  });

  it("근무 시작이 48시간보다 가까우면 expires_at은 근무 시작 시각이다", async () => {
    const workDate = kstDate(1);
    const startsAt = "10:00:00";
    const { slotId } = seedDayWithSlot(
      admin,
      workDate,
      startsAt,
      "18:00:00",
      "안내",
    );
    const candidate = await createApprovedUser();

    const requestId = await sendWorkRequest(admin.client, slotId, [
      candidate.profileId,
    ]);
    const request = await requestForSlot(admin, slotId);
    expect(request?.id).toBe(requestId);

    const expectedInstant = new Date(`${workDate}T${startsAt}+09:00`).getTime();
    const actualInstant = new Date(request!.expires_at).getTime();
    expect(Math.abs(actualInstant - expectedInstant)).toBeLessThan(2000);
  });
});
