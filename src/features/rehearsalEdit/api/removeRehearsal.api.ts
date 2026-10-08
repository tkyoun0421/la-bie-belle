import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function removeRehearsal(client: DB, id: string): Promise<void> {
  const { error } = await client.rpc("remove_rehearsal", { p_id: id });

  if (error) {
    throw toApiError(error);
  }
}
