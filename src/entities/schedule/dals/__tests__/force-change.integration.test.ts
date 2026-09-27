import { forceChange } from "@/entities/schedule/dals/force-change";
import { DomainError } from "@/shared/api/errors";
import {
  backdateDeadline,
  createAdminUser,
  createApprovedUser,
  kstDate,
  kstMonthStart,
  seedAssignment,
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

async function applyForDay(user: RpcCaller, workDate: string): Promise<void> {
  const month = `${workDate.slice(0, 7)}-01`;
  await rpcOrThrow(user, "submit_availability", {
    p_month: month,
    p_dates: [workDate],
  });
}

async function seedOpenAssignment(admin: AdminUser): Promise<{
  scheduleId: string;
  dayId: string;
  workDate: string;
  slotId: string;
  assignmentId: string;
  oldWorker: ApprovedUser;
}> {
  return withFreshMonth(async (monthsFromNow) => {
    const workDate = kstMonthStart(monthsFromNow);
    await rpcOrThrow(admin, "create_schedule", {
      p_month: workDate,
      p_deadline: kstDate(1),
    });
    await rpcOrThrow(admin, "open_day", { p_work_date: workDate });

    const { data: schedule, error: scheduleError } = await admin.client
      .from("schedules")
      .select("id")
      .eq("month", workDate)
      .single<{ id: string }>();
    if (scheduleError || !schedule) {
      throw scheduleError ?? new Error("만든 근무표를 못 찾았다");
    }
    const { data: day, error: dayError } = await admin.client
      .from("days")
      .select("id")
      .eq("work_date", workDate)
      .single<{ id: string }>();
    if (dayError || !day) {
      throw dayError ?? new Error("연 날을 못 찾았다");
    }
    const { data: slot, error: slotError } = await admin.client
      .from("slots")
      .select("id")
      .eq("day_id", day.id)
      .contains("positions", ["안내"])
      .limit(1)
      .single<{ id: string }>();
    if (slotError || !slot) {
      throw slotError ?? new Error("자리를 못 찾았다");
    }

    const oldWorker = await createApprovedUser();
    await applyForDay(oldWorker, workDate);
    const assignmentId = seedAssignment(
      day.id,
      oldWorker.profileId,
      "regular",
      slot.id,
    );

    return {
      scheduleId: schedule.id,
      dayId: day.id,
      workDate,
      slotId: slot.id,
      assignmentId,
      oldWorker,
    };
  });
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

describe("forceChange dal — force_change를 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("확정 뒤 사람을 바꾸면 새 배정 id를 낸다", async () => {
    const { scheduleId, workDate, slotId, assignmentId } =
      await seedOpenAssignment(admin);
    const newWorker = await createApprovedUser();
    await applyForDay(newWorker, workDate);

    backdateDeadline(scheduleId, kstDate(-1));
    await rpcOrThrow(admin, "confirm_schedule", { p_month: workDate });

    const newAssignmentId = await forceChange(
      admin.client,
      assignmentId,
      newWorker.profileId,
    );

    expect(newAssignmentId).not.toBe(assignmentId);
    const { data } = await admin.client
      .from("assignments")
      .select("profile_id, slot_id, ended_at")
      .eq("id", newAssignmentId)
      .single<{
        profile_id: string;
        slot_id: string | null;
        ended_at: string | null;
      }>();
    expect(data?.profile_id).toBe(newWorker.profileId);
    expect(data?.slot_id).toBe(slotId);
    expect(data?.ended_at).toBeNull();
  });

  it("새 사람이 신청 안 했으면 not_applied", async () => {
    const { scheduleId, workDate, assignmentId } =
      await seedOpenAssignment(admin);
    const unappliedWorker = await createApprovedUser();

    backdateDeadline(scheduleId, kstDate(-1));
    await rpcOrThrow(admin, "confirm_schedule", { p_month: workDate });

    const error = await captureDomainError(() =>
      forceChange(admin.client, assignmentId, unappliedWorker.profileId),
    );

    expect(error.code).toBe("not_applied");
  });
});
