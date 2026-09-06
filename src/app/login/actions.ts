"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/shared/lib/create-supabase-server-client";

export async function signInWithGoogle() {
  const origin = (await headers()).get("origin");
  if (!origin) {
    redirect("/login");
  }

  const client = createSupabaseServerClient(await cookies());
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  redirect(error || !data.url ? "/login" : data.url);
}
