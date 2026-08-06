"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/entities/identity/api/require-super-admin";
import { ADMIN_ROLES_PATH } from "@/shared/config/auth-routes.config";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type GrantAdminResult = { ok: true } | { ok: false; code: ErrorCode };

export async function grantAdmin(targetProfileId: string): Promise<GrantAdminResult> {
  const requireResult = await requireSuperAdmin();

  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("grant_admin_role", {
    target_profile_id: targetProfileId,
  });

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "identity_grant_admin_failed", code: error.code })}\n`,
    );
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  revalidatePath(ADMIN_ROLES_PATH);
  return { ok: true };
}
