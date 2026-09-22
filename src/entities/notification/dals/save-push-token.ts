import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function savePushToken(client: Db, token: string): Promise<void> {
  const { error } = await client.rpc("save_push_token", {
    p_token: token,
  });

  if (error) {
    throw toApiError(error);
  }
}
