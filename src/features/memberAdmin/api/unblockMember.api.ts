import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function unblockMember(
  client: DB,
  profileId: string,
): Promise<void> {
  const { error } = await client.rpc("unblock_member", {
    profile_id: profileId,
  });

  if (error) {
    throw toApiError(error);
  }
}
