import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function rotateQr(client: DB): Promise<void> {
  const { error } = await client.rpc("rotate_qr");

  if (error) {
    throw toApiError(error);
  }
}
