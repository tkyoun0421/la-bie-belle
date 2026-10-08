import type { DB } from "@/shared/api/database";
import { takeProfileReadFailure } from "@/shared/utils/devDoor";
import type { MyProfileRow } from "@/entities/profile/api/profile.dto";

const COLUMNS = [
  "id",
  "display_name",
  "photo_url",
  "role",
  "submitted_at",
  "approved_at",
  "rejected_at",
  "blocked_at",
  "left_at",
  "notifications_enabled",
].join(", ");

export async function getMyProfile(
  client: DB,
  userId: string,
): Promise<MyProfileRow | null> {
  if (takeProfileReadFailure()) {
    throw new Error("simulated_profile_read_failure");
  }

  const { data, error } = await client
    .from("profiles")
    .select(COLUMNS)
    .eq("user_id", userId)
    .maybeSingle<MyProfileRow>();

  if (error) {
    throw error;
  }

  return data;
}
