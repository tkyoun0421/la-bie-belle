import { randomUUID } from "node:crypto";
import { DomainError } from "@/shared/api/errors";
import { respondRequest } from "@/entities/schedule/api/respondRequest.api";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  kstDate,
  kstMonthStart,
  seedAssignment,
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

async function requestRow(
  admin: AdminUser,
  requestId: string,
): Promise<{ closed_at: string | null }> {
  const { data, error } = await admin.client
    .from("requests")
    .select("closed_at")
    .eq("id", requestId)
    .single<{ closed_at: string | null }>();
  if (error || !data) {
    throw error ?? new Error("요청을 못 찾았다");
  }
  return data;
}

async function candidateRow(
  admin: AdminUser,
  requestId: string,
  profileId: string,
): Promise<{ status: string; responded_at: string | null }> {
  const { data, error } = await admin.client
    .from("request_candidates")
    .select("status, responded_at")
    .eq("request_id", requestId)
    .eq("profile_id", profileId)
    .single<{ status: string; responded_at: string | null }>();
  if (error || !data) {
    throw error ?? new Error("갈래를 못 찾았다");
  }
  return data;
}

function pastIso(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();
}

describe("respondRequest dal — respond_request를 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("후보가 아니면 not_allowed", async () => {
    const { dayId } = await seedOpenDay(admin);
    const slotId = await slotIdForPosition(admin, dayId, "안내", 0);
    const requestId = seedWorkRequest(slotId, admin.profileId);
    const candidate = await createApprovedUser();
    seedRequestCandidate(requestId, candidate.profileId, "pending");

    const bystander = await createApprovedUser();

    const error = await captureDomainError(() =>
      respondRequest(bystander.client, requestId, "accept"),
    );

    expect(error.code).toBe("not_allowed");
  });

  it("미신청자도 수락으로 즉시 배정된다 — not_applied 검사를 건너뛴다", async () => {
    const { dayId } = await seedOpenDay(admin);
    const slotId = await slotIdForPosition(admin, dayId, "안내", 0);
    const requestId = seedWorkRequest(slotId, admin.profileId);
    const candidate = await createApprovedUser();
    seedRequestCandidate(requestId, candidate.profileId, "pending");

    const assignmentId = await respondRequest(
      candidate.client,
      requestId,
      "accept",
    );

    expect(assignmentId).not.toBeNull();
    const { data } = await admin.client
      .from("assignments")
      .select("profile_id, slot_id, kind")
      .eq("id", assignmentId as string)
      .single<{ profile_id: string; slot_id: string | null; kind: string }>();
    expect(data?.profile_id).toBe(candidate.profileId);
    expect(data?.slot_id).toBe(slotId);
    expect(data?.kind).toBe("regular");

    const candidate2 = await candidateRow(
      admin,
      requestId,
      candidate.profileId,
    );
    expect(candidate2.status).toBe("accepted");
    expect(candidate2.responded_at).not.toBeNull();

    const request = await requestRow(admin, requestId);
    expect(request.closed_at).not.toBeNull();
  });

  it("제한 포지션 자격이 없으면 not_qualified", async () => {
    const { dayId } = await seedOpenDay(admin);
    const slotId = await slotIdForPosition(admin, dayId, "스캔", 0);
    const requestId = seedWorkRequest(slotId, admin.profileId);
    const candidate = await createApprovedUser();
    seedRequestCandidate(requestId, candidate.profileId, "pending");

    const error = await captureDomainError(() =>
      respondRequest(candidate.client, requestId, "accept"),
    );

    expect(error.code).toBe("not_qualified");
  });

  it("그날 이미 다른 자리에 정규로 든 사람이면 already_assigned", async () => {
    const { dayId } = await seedOpenDay(admin);
    const occupiedSlotId = await slotIdForPosition(admin, dayId, "매니저", 0);
    const targetSlotId = await slotIdForPosition(admin, dayId, "매니저", 1);
    const candidate = await createApprovedUser();
    seedAssignment(dayId, candidate.profileId, "regular", occupiedSlotId);

    const requestId = seedWorkRequest(targetSlotId, admin.profileId);
    seedRequestCandidate(requestId, candidate.profileId, "pending");

    const error = await captureDomainError(() =>
      respondRequest(candidate.client, requestId, "accept"),
    );

    expect(error.code).toBe("already_assigned");
  });

  it("닫힌 요청에 답하면 request_closed", async () => {
    const { dayId } = await seedOpenDay(admin);
    const slotId = await slotIdForPosition(admin, dayId, "안내", 0);
    const requestId = seedWorkRequest(slotId, admin.profileId);
    const candidate = await createApprovedUser();
    seedRequestCandidate(requestId, candidate.profileId, "pending");
    execSql(
      "update public.requests set closed_at = now() where id = :'id';\n",
      { id: requestId },
    );

    const error = await captureDomainError(() =>
      respondRequest(candidate.client, requestId, "accept"),
    );

    expect(error.code).toBe("request_closed");
  });

  it("만료된 갈래로 답하면 request_closed", async () => {
    const { dayId } = await seedOpenDay(admin);
    const slotId = await slotIdForPosition(admin, dayId, "안내", 0);
    const requestId = seedWorkRequest(slotId, admin.profileId);
    const candidate = await createApprovedUser();
    seedRequestCandidate(requestId, candidate.profileId, "pending", pastIso(1));

    const error = await captureDomainError(() =>
      respondRequest(candidate.client, requestId, "accept"),
    );

    expect(error.code).toBe("request_closed");
  });

  it("거절하면 그 갈래만 declined고 남은 pending이 있으면 요청은 안 닫힌다", async () => {
    const { dayId } = await seedOpenDay(admin);
    const slotId = await slotIdForPosition(admin, dayId, "매니저", 0);
    const requestId = seedWorkRequest(slotId, admin.profileId);
    const candidateA = await createApprovedUser();
    const candidateB = await createApprovedUser();
    seedRequestCandidate(requestId, candidateA.profileId, "pending");
    seedRequestCandidate(requestId, candidateB.profileId, "pending");

    const result = await respondRequest(
      candidateA.client,
      requestId,
      "decline",
    );
    expect(result).toBeNull();

    const declined = await candidateRow(admin, requestId, candidateA.profileId);
    expect(declined.status).toBe("declined");
    expect(declined.responded_at).not.toBeNull();

    const request = await requestRow(admin, requestId);
    expect(request.closed_at).toBeNull();
  });

  it("마지막 후보가 거절하면 요청이 닫힌다", async () => {
    const { dayId } = await seedOpenDay(admin);
    const slotId = await slotIdForPosition(admin, dayId, "매니저", 1);
    const requestId = seedWorkRequest(slotId, admin.profileId);
    const candidate = await createApprovedUser();
    seedRequestCandidate(requestId, candidate.profileId, "pending");

    const result = await respondRequest(candidate.client, requestId, "decline");
    expect(result).toBeNull();

    const request = await requestRow(admin, requestId);
    expect(request.closed_at).not.toBeNull();
  });

  it("선착순 — 둘이 동시에 수락하면 하나만 통과하고 나머지는 slot_full", async () => {
    const { dayId } = await seedOpenDay(admin);
    const slotId = await slotIdForPosition(admin, dayId, "축가", 0);
    const requestId = seedWorkRequest(slotId, admin.profileId);
    const candidateA = await createApprovedUser();
    const candidateB = await createApprovedUser();
    seedRequestCandidate(requestId, candidateA.profileId, "pending");
    seedRequestCandidate(requestId, candidateB.profileId, "pending");

    const results = await Promise.allSettled([
      respondRequest(candidateA.client, requestId, "accept"),
      respondRequest(candidateB.client, requestId, "accept"),
    ]);

    const fulfilled = results.filter(
      (result): result is PromiseFulfilledResult<string | null> =>
        result.status === "fulfilled",
    );
    const rejected = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(fulfilled[0]?.value).not.toBeNull();
    expect(rejected[0]?.reason).toBeInstanceOf(DomainError);
    expect((rejected[0]?.reason as DomainError).code).toBe("slot_full");

    const { data: liveAssignments, error } = await admin.client
      .from("assignments")
      .select("id")
      .eq("slot_id", slotId)
      .is("ended_at", null)
      .eq("kind", "regular");
    if (error) {
      throw error;
    }
    expect(liveAssignments).toHaveLength(1);
  });

  it("잘못된 answer면 wrong_kind", async () => {
    const { dayId } = await seedOpenDay(admin);
    const slotId = await slotIdForPosition(admin, dayId, "안내", 0);
    const requestId = seedWorkRequest(slotId, admin.profileId);
    const candidate = await createApprovedUser();
    seedRequestCandidate(requestId, candidate.profileId, "pending");

    const error = await captureDomainError(() =>
      respondRequest(
        candidate.client,
        requestId,
        "maybe" as unknown as "accept",
      ),
    );

    expect(error.code).toBe("wrong_kind");
  });

  it("존재하지 않는 요청이면 not_allowed", async () => {
    const worker = await createApprovedUser();

    const error = await captureDomainError(() =>
      respondRequest(worker.client, randomUUID(), "accept"),
    );

    expect(error.code).toBe("not_allowed");
  });
});
