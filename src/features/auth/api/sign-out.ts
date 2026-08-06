"use server";

import "server-only";

import { redirect } from "next/navigation";

import { LOGIN_PATH } from "@/shared/config/auth-routes.config";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type SignOutResult = { ok: false; code: ErrorCode };

export async function signOut(): Promise<SignOutResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  redirect(LOGIN_PATH);
}
