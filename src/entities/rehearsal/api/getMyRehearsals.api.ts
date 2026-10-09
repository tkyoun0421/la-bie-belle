import type { DB } from "@/shared/api/database";
import { lastDateOfMonth } from "@/shared/utils/kstDate";
import { monthStart } from "@/shared/utils/monthRange";
import type { RehearsalRow } from "@/entities/rehearsal/api/rehearsal.dto";
import type { Rehearsal } from "@/entities/rehearsal/model/rehearsal.type";
import { toRehearsal } from "@/entities/rehearsal/utils/rehearsal.mapper";

export const REHEARSAL_COLUMNS =
  "id, profile_id, work_date, starts_at, ends_at, count";

export function monthRange(month: string): { from: string; to: string } {
  return { from: monthStart(month), to: lastDateOfMonth(month) };
}

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
