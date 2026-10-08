import type { DB } from "@/shared/api/database";
import {
  monthRange,
  REHEARSAL_COLUMNS,
} from "@/entities/rehearsal/api/getMyRehearsals.api";
import type { RehearsalWithName } from "@/entities/rehearsal/api/rehearsal.dto";

export async function getAllRehearsals(
  client: DB,
  month: string,
): Promise<RehearsalWithName[]> {
  const { from, to } = monthRange(month);
  const { data, error } = await client
    .from("rehearsals")
    .select(`${REHEARSAL_COLUMNS}, profiles(display_name)`)
    .gte("work_date", from)
    .lte("work_date", to)
    .order("work_date")
    .returns<RehearsalWithName[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}
