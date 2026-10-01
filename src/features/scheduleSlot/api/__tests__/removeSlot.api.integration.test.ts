import { DomainError } from "@/shared/model/error.type";
import { removeSlot } from "@/features/scheduleSlot/api/removeSlot.api";
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

async function seedOpenDayWithSlot(
  admin: AdminUser,
): Promise<{ month: string; scheduleId: string; slotId: string }> {
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
      .contains("positions", ["축가"])
      .single<{ id: string }>();
    if (slotError || !slot) {
      throw slotError ?? new Error("자리를 못 찾았다");
    }

    return { month: workDate, scheduleId: schedule.id, slotId: slot.id };
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

describe("removeSlot dal — remove_slot을 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("확정 전이면 자리를 지운다", async () => {
    const { slotId } = await seedOpenDayWithSlot(admin);

    await removeSlot(admin.client, slotId);

    const { data } = await admin.client
      .from("slots")
      .select("id")
      .eq("id", slotId);
    expect(data).toEqual([]);
  });

  it("확정 시점 날의 자리를 지우면 already_confirmed", async () => {
    const { month, scheduleId, slotId } = await seedOpenDayWithSlot(admin);
    backdateDeadline(scheduleId, kstDate(-1));
    await rpcOrThrow(admin, "confirm_schedule", { p_month: month });

    const error = await captureDomainError(() =>
      removeSlot(admin.client, slotId),
    );

    expect(error.code).toBe("already_confirmed");
  });
});
