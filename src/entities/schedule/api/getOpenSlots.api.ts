import type { DB } from "@/shared/api/database";
import { monthStart, nextMonthStart } from "@/shared/utils/monthRange";
import type { OpenSlotRow } from "@/entities/schedule/api/schedule.dto";
import type { OpenSlot } from "@/entities/schedule/model/schedule.type";
import { toOpenSlot } from "@/entities/schedule/utils/schedule.mapper";

export async function getOpenSlots(
  client: DB,
  month: string,
): Promise<OpenSlot[]> {
  const { data, error } = await client
    .from("open_slots")
    .select("slot_id, day_id, work_date, positions")
    .gte("work_date", monthStart(month))
    .lt("work_date", nextMonthStart(month))
    .order("work_date")
    .returns<OpenSlotRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).flatMap((row) => {
    const slot = toOpenSlot(row);

    return slot === null ? [] : [slot];
  });
}
