import type { DB } from "@/shared/api/database";
import type { ProfilePrivateRow } from "@/entities/profile/api/profile.dto";

export async function getProfilePrivate(
  client: DB,
  profileId: string,
): Promise<ProfilePrivateRow | null> {
  const { data, error } = await client
    .from("profile_private")
    .select("email, phone, birth_date, gender")
    .eq("profile_id", profileId)
    .maybeSingle<ProfilePrivateRow>();

  if (error) {
    throw error;
  }

  return data;
}
