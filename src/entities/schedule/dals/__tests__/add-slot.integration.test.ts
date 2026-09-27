import { DomainError } from "@/shared/api/errors";
import { addSlot } from "@/entities/schedule/dals/add-slot";
import {
  backdateDeadline,
  createAdminUser,
  kstDate,
  kstMonthStart,
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
): Promise<{ month: string; scheduleId: string; dayId: string }> {
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

    return { month: workDate, scheduleId: schedule.id, dayId: day.id };
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

describe("addSlot dal — add_slot을 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("자리 하나를 더한다", async () => {
    const { dayId } = await seedOpenDay(admin);

    await addSlot(admin.client, dayId, "매니저");

    const { data } = await admin.client
      .from("slots")
      .select("id, positions")
      .eq("day_id", dayId)
      .is("ended_at", null);
    const added = (data ?? []).filter(
      (slot) =>
        (slot as { positions: string[] }).positions.join(",") === "매니저",
    );
    expect(added).toHaveLength(3);
  });

  it("확정 시점 날에 더하면 already_confirmed", async () => {
    const { month, scheduleId, dayId } = await seedOpenDay(admin);
    backdateDeadline(scheduleId, kstDate(-1));
    await rpcOrThrow(admin, "confirm_schedule", { p_month: month });

    const error = await captureDomainError(() =>
      addSlot(admin.client, dayId, "매니저"),
    );

    expect(error.code).toBe("already_confirmed");
  });
});
