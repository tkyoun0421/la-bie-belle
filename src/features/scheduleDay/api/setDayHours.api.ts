import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function setDayHours(
  client: DB,
  workDate: string,
  starts: string,
  ends: string,
): Promise<void> {
  const { error } = await client.rpc("set_day_hours", {
    p_work_date: workDate,
    p_starts: starts,
    p_ends: ends,
  });

  if (error) {
    throw toApiError(error);
  }
}
