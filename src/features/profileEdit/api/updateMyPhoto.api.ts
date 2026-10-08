import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function updateMyPhoto(
  client: DB,
  photoUrl: string,
): Promise<void> {
  const { error } = await client.rpc("update_my_photo", {
    photo_url: photoUrl,
  });

  if (error) {
    throw toApiError(error);
  }
}
