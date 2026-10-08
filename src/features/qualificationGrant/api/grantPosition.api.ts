import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function grantPosition(
  client: DB,
  profileId: string,
  position: string,
): Promise<void> {
  const { error } = await client.rpc("grant_position", {
    p_profile_id: profileId,
    p_position: position,
  });

  if (error) {
    throw toApiError(error);
  }
}
