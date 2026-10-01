import { randomUUID } from "node:crypto";
import { DomainError } from "@/shared/model/error.type";
import { createCancelRequest } from "@/features/workRequest/api/createCancelRequest.api";
import {
  createAdminUser,
  createApprovedUser,
  endAssignment,
  execSql,
  kstDate,
  seedAssignment,
  seedCancelRequest,
  type AdminUser,
  type ApprovedUser,
} from "@tests/integration/postgres";

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

function positionsLiteral(positions: string[]): string {
  return `{${positions.map((position) => `"${position}"`).join(",")}}`;
}

/**
 * 임의 날짜에 날·자리·배정을 직접 심는다 — `open_day`는 지난 날짜와 오늘을 못 열게 막지
 * 않으니 문제 없지만, 재실행에도 안전하게 같은 날짜를 다시 쓰려면 직접 심는다.
 */
function seedAssignedDay(
  admin: AdminUser,
  worker: ApprovedUser,
  workDate: string,
  position: string = "안내",
): { dayId: string; slotId: string; assignmentId: string } {
  const month = `${workDate.slice(0, 7)}-01`;
  const dayId = randomUUID();
  const slotId = randomUUID();

  execSql(
    [
      "delete from public.days where work_date = :'work_date';",
      "insert into public.schedules (month, created_by) values (:'month', :'created_by') on conflict (month) do nothing;",
      "insert into public.days (id, schedule_id, work_date, starts_at, ends_at, opened_by)",
      "select :'day_id', id, :'work_date', '10:00:00', '22:00:00', :'created_by' from public.schedules where month = :'month';",
      `insert into public.slots (id, day_id, positions) values (:'slot_id', :'day_id', '${positionsLiteral([position])}');`,
    ].join("\n") + "\n",
    {
      month,
      created_by: admin.profileId,
      work_date: workDate,
      day_id: dayId,
      slot_id: slotId,
    },
  );

  const assignmentId = seedAssignment(
    dayId,
    worker.profileId,
    "regular",
    slotId,
  );

  return { dayId, slotId, assignmentId };
}

async function cancelRequestFor(
  admin: AdminUser,
  cancelRequestId: string,
): Promise<{
  decided_at: string | null;
  reason: string;
  profile_id: string;
}> {
  const { data, error } = await admin.client
    .from("cancel_requests")
    .select("decided_at, reason, profile_id")
    .eq("id", cancelRequestId)
    .single<{
      decided_at: string | null;
      reason: string;
      profile_id: string;
    }>();
  if (error || !data) {
    throw error ?? new Error("취소 요청을 못 찾았다");
  }
  return data;
}

describe("createCancelRequest dal — create_cancel_request를 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("본인 배정에 정상 요청하면 cancel_requests 행이 선다", async () => {
    const worker = await createApprovedUser();
    const { assignmentId } = seedAssignedDay(admin, worker, kstDate(1));

    const cancelRequestId = await createCancelRequest(
      worker.client,
      assignmentId,
      "개인 사정으로 근무가 어렵습니다",
    );

    const row = await cancelRequestFor(admin, cancelRequestId);
    expect(row.decided_at).toBeNull();
    expect(row.profile_id).toBe(worker.profileId);
  });

  it("남의 배정이면 not_allowed", async () => {
    const owner = await createApprovedUser();
    const stranger = await createApprovedUser();
    const { assignmentId } = seedAssignedDay(admin, owner, kstDate(1));

    const error = await captureDomainError(() =>
      createCancelRequest(stranger.client, assignmentId, "개인 사정"),
    );

    expect(error.code).toBe("not_allowed");
  });

  it("이미 닫힌 배정이면 stale", async () => {
    const worker = await createApprovedUser();
    const { assignmentId } = seedAssignedDay(admin, worker, kstDate(1));
    endAssignment(assignmentId);

    const error = await captureDomainError(() =>
      createCancelRequest(worker.client, assignmentId, "개인 사정"),
    );

    expect(error.code).toBe("stale");
  });

  it("근무 당일이면 window_closed", async () => {
    const worker = await createApprovedUser();
    const { assignmentId } = seedAssignedDay(admin, worker, kstDate(0));

    const error = await captureDomainError(() =>
      createCancelRequest(worker.client, assignmentId, "개인 사정"),
    );

    expect(error.code).toBe("window_closed");
  });

  it("사유가 비면 invalid_reason", async () => {
    const worker = await createApprovedUser();
    const { assignmentId } = seedAssignedDay(admin, worker, kstDate(1));

    const error = await captureDomainError(() =>
      createCancelRequest(worker.client, assignmentId, ""),
    );

    expect(error.code).toBe("invalid_reason");
  });

  it("사유가 100자를 넘으면 invalid_reason", async () => {
    const worker = await createApprovedUser();
    const { assignmentId } = seedAssignedDay(admin, worker, kstDate(1));

    const error = await captureDomainError(() =>
      createCancelRequest(worker.client, assignmentId, "가".repeat(101)),
    );

    expect(error.code).toBe("invalid_reason");
  });

  it("사유가 정확히 100자면 통과한다", async () => {
    const worker = await createApprovedUser();
    const { assignmentId } = seedAssignedDay(admin, worker, kstDate(1));

    const cancelRequestId = await createCancelRequest(
      worker.client,
      assignmentId,
      "가".repeat(100),
    );

    const row = await cancelRequestFor(admin, cancelRequestId);
    expect(row.reason).toHaveLength(100);
  });

  it("살아 있는 취소 요청이 있으면 already_requested", async () => {
    const worker = await createApprovedUser();
    const { assignmentId } = seedAssignedDay(admin, worker, kstDate(1));
    seedCancelRequest(assignmentId, worker.profileId, "먼저 낸 사유");

    const error = await captureDomainError(() =>
      createCancelRequest(worker.client, assignmentId, "다시 낸 사유"),
    );

    expect(error.code).toBe("already_requested");
  });

  it("거절된 뒤에는 다시 요청할 수 있다", async () => {
    const worker = await createApprovedUser();
    const { assignmentId } = seedAssignedDay(admin, worker, kstDate(1));
    seedCancelRequest(
      assignmentId,
      worker.profileId,
      "먼저 낸 사유",
      "rejected",
      "사정을 알겠지만 자리가 안 빈다",
    );

    const cancelRequestId = await createCancelRequest(
      worker.client,
      assignmentId,
      "다시 낸 사유",
    );

    const row = await cancelRequestFor(admin, cancelRequestId);
    expect(row.decided_at).toBeNull();
    expect(row.reason).toBe("다시 낸 사유");
  });
});
