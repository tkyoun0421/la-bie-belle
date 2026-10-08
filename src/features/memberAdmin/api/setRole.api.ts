import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function setRole(
  client: DB,
  profileId: string,
  role: string,
): Promise<void> {
  const { error } = await client.rpc("set_role", {
    profile_id: profileId,
    role,
  });

  if (error) {
    throw toApiError(error);
  }
}
