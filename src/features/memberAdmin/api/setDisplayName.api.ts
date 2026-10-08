import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function setDisplayName(
  client: DB,
  profileId: string,
  name: string,
): Promise<void> {
  const { error } = await client.rpc("set_display_name", {
    profile_id: profileId,
    display_name: name,
  });

  if (error) {
    throw toApiError(error);
  }
}
