"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { mapDormancyRpcErrorCode } from "@/entities/identity/model/dormancy";
import { DORMANT_PATH, HOME_PATH } from "@/shared/config/auth-routes.config";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type ReactivateOwnResult = { ok: false; code: ErrorCode };

export async function reactivateOwnProfile(): Promise<ReactivateOwnResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return { ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED };
  }

  const { error } = await supabase.rpc("reactivate_own_profile");

  revalidatePath(DORMANT_PATH);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "identity_reactivate_own_profile_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapDormancyRpcErrorCode(error.code) };
  }

  redirect(HOME_PATH);
}
