import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function getServerNow(client: DB): Promise<string> {
  const { data, error } = await client.rpc("server_now");

  if (error) {
    throw toApiError(error);
  }

  return data;
}
