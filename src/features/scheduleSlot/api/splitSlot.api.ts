import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function splitSlot(client: DB, slotId: string): Promise<void> {
  const { error } = await client.rpc("split_slot", { p_slot_id: slotId });

  if (error) {
    throw toApiError(error);
  }
}
