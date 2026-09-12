"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseRequestClient } from "@/shared/lib/create-supabase-request-client";

export async function signInWithGoogle() {
  const origin = (await headers()).get("origin");
  if (!origin) {
    redirect("/login");
  }

  const client = await createSupabaseRequestClient();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  redirect(error || !data.url ? "/login" : data.url);
}
