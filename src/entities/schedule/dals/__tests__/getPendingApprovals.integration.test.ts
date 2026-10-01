import { getPendingApprovals } from "@/entities/schedule/dals/get-pending-approvals";
import {
  createAdminUser,
  createApprovedUser,
  kstDate,
  kstMonthStart,
  seedAssignment,
  seedCancelRequest,
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

async function seedPendingCancelRequest(
  admin: AdminUser,
  worker: ApprovedUser,
  position: string = "안내",
): Promise<{ cancelRequestId: string; assignmentId: string; dayId: string }> {
  const { dayId } = await seedOpenDay(admin);
  const slotId = await slotIdForPosition(admin, dayId, position, 0);
  const assignmentId = seedAssignment(
    dayId,
    worker.profileId,
    "regular",
    slotId,
  );
  const cancelRequestId = seedCancelRequest(assignmentId, worker.profileId);
  return { cancelRequestId, assignmentId, dayId };
}

type PendingApprovalRow = {
  id: string;
  assignment_id: string;
  reason: string;
};

describe("getPendingApprovals dal — 미판정 근무 취소 요청을 읽는다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("관리자는 미판정 취소 요청을 전부 읽는다", async () => {
    const worker = await createApprovedUser();
    const { cancelRequestId } = await seedPendingCancelRequest(admin, worker);

    const rows = (await getPendingApprovals(
      admin.client,
    )) as unknown as PendingApprovalRow[];

    expect(rows.map((row) => row.id)).toContain(cancelRequestId);
  });

  it("판정된 요청은 목록에서 빠진다", async () => {
    const worker = await createApprovedUser();
    const { assignmentId } = await seedPendingCancelRequest(admin, worker);
    const decidedCancelRequestId = seedCancelRequest(
      assignmentId,
      worker.profileId,
      "이미 판정된 사유",
      "approved",
    );

    const rows = (await getPendingApprovals(
      admin.client,
    )) as unknown as PendingApprovalRow[];

    expect(rows.map((row) => row.id)).not.toContain(decidedCancelRequestId);
  });

  it("근무자는 남의 미판정 취소 요청을 못 읽는다 — RLS가 본인·관리자로 좁힌다", async () => {
    const owner = await createApprovedUser();
    const reader = await createApprovedUser();
    const { cancelRequestId } = await seedPendingCancelRequest(admin, owner);

    const rows = (await getPendingApprovals(
      reader.client,
    )) as unknown as PendingApprovalRow[];

    expect(rows.map((row) => row.id)).not.toContain(cancelRequestId);
  });
});
