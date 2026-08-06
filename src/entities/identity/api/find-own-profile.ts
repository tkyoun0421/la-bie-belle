import "server-only";

import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export async function findOwnProfile(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    throw new Error("no authenticated user");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("profile lookup failed");
  }

  return data !== null;
}
