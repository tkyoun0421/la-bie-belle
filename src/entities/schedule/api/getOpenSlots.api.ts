import type { DB } from "@/shared/api/database";
import { monthStart, nextMonthStart } from "@/shared/utils/monthRange";
import type { OpenSlot } from "@/entities/schedule/api/schedule.dto";

type OpenSlotRow = {
  slot_id: string | null;
  day_id: string | null;
  work_date: string | null;
  positions: string[] | null;
};

function isFilled(row: OpenSlotRow): boolean {
  return (
    row.slot_id !== null &&
    row.day_id !== null &&
    row.work_date !== null &&
    row.positions !== null
  );
}

export async function getOpenSlots(
  client: DB,
  month: string,
): Promise<OpenSlot[]> {
  const { data, error } = await client
    .from("open_slots")
    .select("slot_id, day_id, work_date, positions")
    .gte("work_date", monthStart(month))
    .lt("work_date", nextMonthStart(month))
    .order("work_date");

  if (error) {
    throw error;
  }

  return (data ?? []).filter(isFilled) as OpenSlot[];
}
