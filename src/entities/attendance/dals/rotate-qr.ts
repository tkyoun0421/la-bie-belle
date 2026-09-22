import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function rotateQr(client: Db): Promise<void> {
  const { error } = await client.rpc("rotate_qr");

  if (error) {
    throw toApiError(error);
  }
}
