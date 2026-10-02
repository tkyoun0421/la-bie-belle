import {
  createAdminUser,
  createApprovedUser,
  execSql,
  kstDate,
  kstMonthStart,
  queryColumn,
  seedRequestCandidate,
  seedWorkRequest,
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

function pastIso(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();
}

function futureIso(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 3600 * 1000).toISOString();
}

function callExpireRequests(): void {
  execSql("select internal.expire_requests();\n");
}

async function requestClosedAt(
  admin: AdminUser,
  requestId: string,
): Promise<string | null> {
  const { data, error } = await admin.client
    .from("requests")
    .select("closed_at")
    .eq("id", requestId)
    .single<{ closed_at: string | null }>();
  if (error || !data) {
    throw error ?? new Error("요청을 못 찾았다");
  }
  return data.closed_at;
}

async function candidateStatus(
  admin: AdminUser,
  requestId: string,
  profileId: string,
): Promise<string> {
  const { data, error } = await admin.client
    .from("request_candidates")
    .select("status")
    .eq("request_id", requestId)
    .eq("profile_id", profileId)
    .single<{ status: string }>();
  if (error || !data) {
    throw error ?? new Error("갈래를 못 찾았다");
  }
  return data.status;
}

describe("internal.expire_requests — 매 분 도는 만료 배치", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("지난 pending만 남은 요청은 닫히고 갈래 status는 pending 그대로다", async () => {
    const { dayId } = await seedOpenDay(admin);
    const slotId = await slotIdForPosition(admin, dayId, "안내", 0);
    const requestId = seedWorkRequest(slotId, admin.profileId, pastIso(1));
    const candidate = await createApprovedUser();
    seedRequestCandidate(requestId, candidate.profileId, "pending", pastIso(1));

    callExpireRequests();

    expect(await requestClosedAt(admin, requestId)).not.toBeNull();
    expect(await candidateStatus(admin, requestId, candidate.profileId)).toBe(
      "pending",
    );
  });

  it("안 지난 pending이 하나라도 남으면 안 닫힌다", async () => {
    const { dayId } = await seedOpenDay(admin);
    const slotId = await slotIdForPosition(admin, dayId, "안내", 1);
    const expiredCandidate = await createApprovedUser();
    const liveCandidate = await createApprovedUser();
    const requestId = seedWorkRequest(slotId, admin.profileId, futureIso(1));
    seedRequestCandidate(
      requestId,
      expiredCandidate.profileId,
      "pending",
      pastIso(1),
    );
    seedRequestCandidate(
      requestId,
      liveCandidate.profileId,
      "pending",
      futureIso(1),
    );

    callExpireRequests();

    expect(await requestClosedAt(admin, requestId)).toBeNull();
  });

  it("멱등이다 — 두 번 불러도 오류 없이 같은 결과다", async () => {
    const { dayId } = await seedOpenDay(admin);
    const slotId = await slotIdForPosition(admin, dayId, "매니저", 0);
    const requestId = seedWorkRequest(slotId, admin.profileId, pastIso(1));
    const candidate = await createApprovedUser();
    seedRequestCandidate(requestId, candidate.profileId, "pending", pastIso(1));

    callExpireRequests();
    const firstClosedAt = await requestClosedAt(admin, requestId);
    expect(firstClosedAt).not.toBeNull();

    expect(() => callExpireRequests()).not.toThrow();
    const secondClosedAt = await requestClosedAt(admin, requestId);
    expect(secondClosedAt).toBe(firstClosedAt);
  });

  it("pg_cron에 expire-requests가 매 분 도는 작업으로 등록됐다", () => {
    const jobs = queryColumn(
      "select jobname from cron.job where jobname = 'expire-requests';\n",
    );
    expect(jobs).toEqual(["expire-requests"]);
  });
});
