import type { DB } from "@/shared/api/database";
import {
  monthRange,
  REHEARSAL_COLUMNS,
} from "@/entities/rehearsal/api/getMyRehearsals.api";
import type { NamedRehearsalRow } from "@/entities/rehearsal/api/rehearsal.dto";
import type { Rehearsal } from "@/entities/rehearsal/model/rehearsal.type";
import { toNamedRehearsal } from "@/entities/rehearsal/utils/rehearsal.mapper";

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
