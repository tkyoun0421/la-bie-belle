import type { DB } from "@/shared/api/database";
import {
  REHEARSAL_COLUMNS,
  type NamedRehearsalRow,
} from "@/entities/rehearsal/api/rehearsal.dto";
import type { Rehearsal } from "@/entities/rehearsal/model/rehearsal.type";
import { toNamedRehearsal } from "@/entities/rehearsal/utils/rehearsal.mapper";
import { monthRange } from "@/entities/rehearsal/utils/rehearsalMonthRange.utils";

export async function getAllRehearsals(
  client: DB,
  month: string,
): Promise<Rehearsal[]> {
  const { from, to } = monthRange(month);
  const { data, error } = await client
    .from("rehearsals")
    .select(`${REHEARSAL_COLUMNS}, profiles(display_name)`)
    .gte("work_date", from)
    .lte("work_date", to)
    .order("work_date")
    .returns<NamedRehearsalRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(toNamedRehearsal);
}
