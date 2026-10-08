import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function approveMember(
  client: DB,
  profileId: string,
): Promise<void> {
  const { error } = await client.rpc("approve_member", {
    profile_id: profileId,
  });

  if (error) {
    throw toApiError(error);
  }
}
