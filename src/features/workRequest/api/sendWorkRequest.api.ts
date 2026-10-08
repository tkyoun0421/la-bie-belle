import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function sendWorkRequest(
  client: DB,
  slotId: string,
  profileIds: readonly string[],
): Promise<string> {
  const { data, error } = await client.rpc("send_work_request", {
    p_slot_id: slotId,
    p_profile_ids: [...profileIds],
  });

  if (error) {
    throw toApiError(error);
  }

  return data;
}
