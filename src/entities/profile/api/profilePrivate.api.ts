import type { DB } from "@/shared/api/database";
import type { ProfilePrivateRow } from "@/entities/profile/api/profile.dto";
import type { ProfilePrivate } from "@/entities/profile/model/profile.type";
import { toProfilePrivate } from "@/entities/profile/utils/profile.mapper";

export async function getProfilePrivate(
  client: DB,
  profileId: string,
): Promise<ProfilePrivate | null> {
  const { data, error } = await client
    .from("profile_private")
    .select("email, phone, birth_date, gender")
    .eq("profile_id", profileId)
    .maybeSingle<ProfilePrivateRow>();

  if (error) {
    throw error;
  }

  return data === null ? null : toProfilePrivate(data);
}
