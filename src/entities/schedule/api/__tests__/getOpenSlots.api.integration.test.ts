import type { Database } from "@/shared/api/database";
import { getOpenSlots } from "@/entities/schedule/api/getOpenSlots.api";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  kstDate,
  kstMonthStart,
  seedAssignment,
  withFreshMonth,
  type AdminUser,
  type ApprovedUser,
} from "@tests/integration/postgres";

type FunctionName = keyof Database["public"]["Functions"];

async function rpcOrThrow<Name extends FunctionName>(
  admin: AdminUser,
  fn: Name,
  args: Database["public"]["Functions"][Name]["Args"],
): Promise<void> {
  const { error } = await admin.client.rpc(fn, args);
  if (error) {
    throw error;
  }
}

type SeededDay = { month: string; dayId: string; workDate: string };

async function seedOpenDay(admin: AdminUser): Promise<SeededDay> {
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

    return { month: workDate.slice(0, 7), dayId: data.id, workDate };
  });
}

async function slotIdsForDay(
  admin: AdminUser,
  dayId: string,
): Promise<string[]> {
  const { data, error } = await admin.client
    .from("slots")
    .select("id")
    .eq("day_id", dayId);
  if (error) {
    throw error;
  }
  return (data ?? []).map((row) => (row as { id: string }).id);
}

function closeSlot(slotId: string): void {
  execSql("update public.slots set ended_at = now() where id = :'slot_id';\n", {
    slot_id: slotId,
  });
}

describe("getOpenSlots dal — 빈 자리를 open_slots 뷰로 읽는다(design.md 「계산의 예외 하나」)", () => {
  let admin: AdminUser;
  let worker: ApprovedUser;

  beforeAll(async () => {
    admin = await createAdminUser();
    worker = await createApprovedUser();
  });

  it("그 달 범위의 빈 자리만 온다", async () => {
    const inMonth = await seedOpenDay(admin);
    const otherMonth = await seedOpenDay(admin);

    const slots = await getOpenSlots(admin.client, inMonth.month);

    expect(slots.some((row) => row.dayId === inMonth.dayId)).toBe(true);
    expect(slots.some((row) => row.dayId === otherMonth.dayId)).toBe(false);
  });

  it("정규 배정이 있는 자리는 빠진다", async () => {
    const { month, dayId } = await seedOpenDay(admin);
    const [slotId] = await slotIdsForDay(admin, dayId);
    seedAssignment(dayId, worker.profileId, "regular", slotId);

    const slots = await getOpenSlots(admin.client, month);

    expect(slots.some((row) => row.slotId === slotId)).toBe(false);
    expect(slots.filter((row) => row.dayId === dayId)).toHaveLength(10);
  });

  it("endedAt이 찍힌 자리는 빠진다", async () => {
    const { month, dayId } = await seedOpenDay(admin);
    const [slotId] = await slotIdsForDay(admin, dayId);
    closeSlot(slotId!);

    const slots = await getOpenSlots(admin.client, month);

    expect(slots.some((row) => row.slotId === slotId)).toBe(false);
    expect(slots.filter((row) => row.dayId === dayId)).toHaveLength(10);
  });
});
