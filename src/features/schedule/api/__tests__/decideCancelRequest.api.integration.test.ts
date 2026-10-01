import { DomainError } from "@/shared/api/errors";
import { decideCancelRequest } from "@/features/schedule/api/decideCancelRequest.api";
import {
  createAdminUser,
  createApprovedUser,
  kstDate,
  kstMonthStart,
  seedAssignment,
  seedCancelRequest,
  seedWorkRequest,
  seedRequestCandidate,
  withFreshMonth,
  type AdminUser,
  type ApprovedUser,
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

async function seedLiveCancelRequest(
  admin: AdminUser,
  position: string = "안내",
): Promise<{
  cancelRequestId: string;
  assignmentId: string;
  slotId: string;
  worker: ApprovedUser;
}> {
  const { dayId } = await seedOpenDay(admin);
  const slotId = await slotIdForPosition(admin, dayId, position, 0);
  const worker = await createApprovedUser();
  const assignmentId = seedAssignment(
    dayId,
    worker.profileId,
    "regular",
    slotId,
  );
  const cancelRequestId = seedCancelRequest(assignmentId, worker.profileId);
  return { cancelRequestId, assignmentId, slotId, worker };
}

async function assignmentRow(
  admin: AdminUser,
  assignmentId: string,
): Promise<{
  ended_at: string | null;
  ended_reason: string | null;
  ended_by: string | null;
}> {
  const { data, error } = await admin.client
    .from("assignments")
    .select("ended_at, ended_reason, ended_by")
    .eq("id", assignmentId)
    .single<{
      ended_at: string | null;
      ended_reason: string | null;
      ended_by: string | null;
    }>();
  if (error || !data) {
    throw error ?? new Error("배정을 못 찾았다");
  }
  return data;
}

async function cancelRequestRow(
  admin: AdminUser,
  cancelRequestId: string,
): Promise<{
  decided_at: string | null;
  decided_by: string | null;
  decision: string | null;
  decision_reason: string | null;
}> {
  const { data, error } = await admin.client
    .from("cancel_requests")
    .select("decided_at, decided_by, decision, decision_reason")
    .eq("id", cancelRequestId)
    .single<{
      decided_at: string | null;
      decided_by: string | null;
      decision: string | null;
      decision_reason: string | null;
    }>();
  if (error || !data) {
    throw error ?? new Error("취소 요청을 못 찾았다");
  }
  return data;
}

describe("decideCancelRequest dal — decide_cancel_request를 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("관리자가 아니면 not_allowed", async () => {
    const worker = await createApprovedUser();
    const { cancelRequestId } = await seedLiveCancelRequest(admin);

    const error = await captureDomainError(() =>
      decideCancelRequest(worker.client, cancelRequestId, "approved"),
    );

    expect(error.code).toBe("not_allowed");
  });

  it("승인하면 배정이 닫히고 판정이 찍힌다", async () => {
    const { cancelRequestId, assignmentId } =
      await seedLiveCancelRequest(admin);

    await decideCancelRequest(admin.client, cancelRequestId, "approved");

    const assignment = await assignmentRow(admin, assignmentId);
    expect(assignment.ended_at).not.toBeNull();
    expect(assignment.ended_reason).not.toBeNull();
    expect(assignment.ended_by).toBe(admin.profileId);

    const cancelRequest = await cancelRequestRow(admin, cancelRequestId);
    expect(cancelRequest.decision).toBe("approved");
    expect(cancelRequest.decided_at).not.toBeNull();
    expect(cancelRequest.decided_by).toBe(admin.profileId);
  });

  it("승인하면 그 자리의 살아 있는 근무 요청도 같이 닫는다", async () => {
    const { cancelRequestId, slotId } = await seedLiveCancelRequest(admin);
    const requestId = seedWorkRequest(slotId, admin.profileId);
    const candidate = await createApprovedUser();
    seedRequestCandidate(requestId, candidate.profileId, "pending");

    await decideCancelRequest(admin.client, cancelRequestId, "approved");

    const { data, error } = await admin.client
      .from("requests")
      .select("closed_at")
      .eq("id", requestId)
      .single<{ closed_at: string | null }>();
    if (error || !data) {
      throw error ?? new Error("요청을 못 찾았다");
    }
    expect(data.closed_at).not.toBeNull();
  });

  it("거절하면 이유가 필수다 — invalid_reason", async () => {
    const { cancelRequestId } = await seedLiveCancelRequest(admin);

    const error = await captureDomainError(() =>
      decideCancelRequest(admin.client, cancelRequestId, "rejected"),
    );

    expect(error.code).toBe("invalid_reason");
  });

  it("거절하면 배정은 그대로 남고 이유가 찍힌다", async () => {
    const { cancelRequestId, assignmentId } =
      await seedLiveCancelRequest(admin);

    await decideCancelRequest(
      admin.client,
      cancelRequestId,
      "rejected",
      "자리가 안 빈다",
    );

    const assignment = await assignmentRow(admin, assignmentId);
    expect(assignment.ended_at).toBeNull();

    const cancelRequest = await cancelRequestRow(admin, cancelRequestId);
    expect(cancelRequest.decision).toBe("rejected");
    expect(cancelRequest.decision_reason).toBe("자리가 안 빈다");
  });

  it("decision이 approved·rejected가 아니면 wrong_kind", async () => {
    const { cancelRequestId } = await seedLiveCancelRequest(admin);

    const error = await captureDomainError(() =>
      decideCancelRequest(
        admin.client,
        cancelRequestId,
        "maybe" as unknown as "approved",
      ),
    );

    expect(error.code).toBe("wrong_kind");
  });

  it("이미 판정된 요청을 다시 판정하면 already_decided", async () => {
    const { cancelRequestId } = await seedLiveCancelRequest(admin);
    await decideCancelRequest(admin.client, cancelRequestId, "approved");

    const error = await captureDomainError(() =>
      decideCancelRequest(admin.client, cancelRequestId, "approved"),
    );

    expect(error.code).toBe("already_decided");
  });

  it("두 관리자가 동시에 판정하면 하나만 통과하고 나머지는 already_decided", async () => {
    const { cancelRequestId } = await seedLiveCancelRequest(admin);
    const admin2 = await createAdminUser();

    const results = await Promise.allSettled([
      decideCancelRequest(admin.client, cancelRequestId, "approved"),
      decideCancelRequest(admin2.client, cancelRequestId, "approved"),
    ]);

    const fulfilled = results.filter(
      (result): result is PromiseFulfilledResult<void> =>
        result.status === "fulfilled",
    );
    const rejected = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.reason).toBeInstanceOf(DomainError);
    expect((rejected[0]?.reason as DomainError).code).toBe("already_decided");
  });
});
