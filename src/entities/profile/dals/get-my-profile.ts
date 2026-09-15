import type { SupabaseClient } from "@supabase/supabase-js";

export type MyProfileRow = {
  id: string;
  display_name: string | null;
  photo_url: string | null;
  role: string;
  submitted_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  blocked_at: string | null;
  left_at: string | null;
};

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
].join(", ");

export async function getMyProfile(
  client: SupabaseClient,
  userId: string,
): Promise<MyProfileRow | null> {
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
