import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function mergeSlots(
  client: DB,
  dayId: string,
  from: string,
  to: string,
): Promise<void> {
  const { error } = await client.rpc("merge_slots", {
    p_day_id: dayId,
    p_from: from,
    p_to: to,
  });

  if (error) {
    throw toApiError(error);
  }
}
