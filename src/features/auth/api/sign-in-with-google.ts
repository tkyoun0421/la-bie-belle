"use server";

import "server-only";

import { redirect } from "next/navigation";

import { AUTH_CALLBACK_PATH, LOGIN_ERROR_PATH } from "@/shared/config/auth-routes.config";
import { env } from "@/shared/config/env.server";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}${AUTH_CALLBACK_PATH}`,
    },
  });

  if (error) {
    redirect(LOGIN_ERROR_PATH);
  }

  redirect(data.url);
}
