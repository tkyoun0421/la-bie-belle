import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/shared/lib/create-supabase-server-client";

export async function createSupabaseRequestClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(cookieStore);
}
