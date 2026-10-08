import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function blockMember(
  client: DB,
  profileId: string,
): Promise<void> {
  const { error } = await client.rpc("block_member", { profile_id: profileId });

  if (error) {
    throw toApiError(error);
  }
}
