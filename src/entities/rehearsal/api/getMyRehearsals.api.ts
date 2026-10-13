import type { DB } from "@/shared/api/database";
import {
  REHEARSAL_COLUMNS,
  type RehearsalRow,
} from "@/entities/rehearsal/api/rehearsal.dto";
import type { Rehearsal } from "@/entities/rehearsal/model/rehearsal.type";
import { toRehearsal } from "@/entities/rehearsal/utils/rehearsal.mapper";
import { monthRange } from "@/entities/rehearsal/utils/rehearsalMonthRange.utils";

export async function getMyRehearsals(
  client: DB,
  month: string,
): Promise<Rehearsal[]> {
  const { from, to } = monthRange(month);
  const { data, error } = await client
    .from("rehearsals")
    .select(REHEARSAL_COLUMNS)
    .gte("work_date", from)
    .lte("work_date", to)
    .order("work_date")
    .returns<RehearsalRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(toRehearsal);
}
