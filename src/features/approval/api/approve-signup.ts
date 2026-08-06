"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/entities/identity/api/require-admin";
import { mapApprovalRpcErrorCode } from "@/entities/identity/model/approval";
import { ADMIN_APPROVALS_PATH } from "@/shared/config/auth-routes.config";
import { type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type ApproveSignupResult = { ok: true } | { ok: false; code: ErrorCode };

export async function approveSignup(targetProfileId: string): Promise<ApproveSignupResult> {
  const requireResult = await requireAdmin();

  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("approve_signup", { target: targetProfileId });

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "identity_approve_signup_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapApprovalRpcErrorCode(error.code) };
  }

  revalidatePath(ADMIN_APPROVALS_PATH);
  return { ok: true };
}
