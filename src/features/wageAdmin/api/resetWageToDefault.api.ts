import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function resetWageToDefault(
  client: DB,
  profileId: string,
): Promise<void> {
  const { error } = await client.rpc("reset_wage_to_default", {
    p_profile_id: profileId,
  });

  if (error) {
    throw toApiError(error);
  }
}
