import { DomainError } from "@/shared/model/error.type";
import { mergeSlots } from "@/features/scheduleSlot/api/mergeSlots.api";
import {
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

type SlotRow = { id: string; positions: string[] };

async function slotsByPosition(
  admin: AdminUser,
  dayId: string,
  position: string,
): Promise<SlotRow[]> {
  const { data, error } = await admin.client
    .from("slots")
    .select("id, positions")
    .eq("day_id", dayId)
    .is("ended_at", null);
  if (error) {
    throw error;
  }
  return ((data ?? []) as SlotRow[]).filter(
    (slot) => slot.positions.length === 1 && slot.positions[0] === position,
  );
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

async function applyForDay(
  user: ApprovedUser,
  workDate: string,
): Promise<void> {
  const month = `${workDate.slice(0, 7)}-01`;
  await rpcOrThrow(user, "submit_availability", {
    p_month: month,
    p_dates: [workDate],
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

describe("mergeSlots dal — merge_slots를 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("빈 자리 둘을 합치면 받는 쪽 positions가 늘어난다", async () => {
    const { dayId } = await seedOpenDay(admin);

    await mergeSlots(admin.client, dayId, "매니저", "축가");

    const { data } = await admin.client
      .from("slots")
      .select("id, positions")
      .eq("day_id", dayId)
      .is("ended_at", null);
    const mergedRow = ((data ?? []) as SlotRow[]).find(
      (slot) => slot.positions.length === 2,
    );
    expect(mergedRow?.positions).toEqual(["축가", "매니저"]);
  });

  it("양쪽 다 찼으면 no_empty_slot", async () => {
    const { dayId, workDate } = await seedOpenDay(admin);
    const first = await createApprovedUser();
    const second = await createApprovedUser();
    const third = await createApprovedUser();
    await applyForDay(first, workDate);
    await applyForDay(second, workDate);
    await applyForDay(third, workDate);

    const 매니저Slots = await slotsByPosition(admin, dayId, "매니저");
    const 축가Slots = await slotsByPosition(admin, dayId, "축가");
    seedAssignment(dayId, first.profileId, "regular", 매니저Slots[0]!.id);
    seedAssignment(dayId, second.profileId, "regular", 매니저Slots[1]!.id);
    seedAssignment(dayId, third.profileId, "regular", 축가Slots[0]!.id);

    const error = await captureDomainError(() =>
      mergeSlots(admin.client, dayId, "매니저", "축가"),
    );

    expect(error.code).toBe("no_empty_slot");
  });
});
