"use server";

import "server-only";

import { redirect } from "next/navigation";

import { env } from "@/shared/config/env.server";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    redirect("/login?error=auth");
  }

  redirect(data.url);
}
