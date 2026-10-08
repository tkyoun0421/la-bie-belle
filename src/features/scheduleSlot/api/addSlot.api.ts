import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function addSlot(
  client: DB,
  dayId: string,
  position: string,
): Promise<void> {
  const { error } = await client.rpc("add_slot", {
    p_day_id: dayId,
    p_position: position,
  });

  if (error) {
    throw toApiError(error);
  }
}
