"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/entities/identity/api/require-admin";
import { mapApprovalRpcErrorCode, RejectReasonSchema } from "@/entities/identity/model/approval";
import { ADMIN_APPROVALS_PATH } from "@/shared/config/auth-routes.config";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type RejectSignupResult = { ok: true } | { ok: false; code: ErrorCode };

export async function rejectSignup(
  targetProfileId: string,
  reason?: string,
): Promise<RejectSignupResult> {
  const requireResult = await requireAdmin();

  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const parsed = RejectReasonSchema.safeParse(reason ?? "");
  if (!parsed.success) {
    return { ok: false, code: ERROR_CODE.IDENTITY_VALIDATION };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("reject_signup", {
    target: targetProfileId,
    reason: parsed.data.length > 0 ? parsed.data : null,
  });

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "identity_reject_signup_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapApprovalRpcErrorCode(error.code) };
  }

  revalidatePath(ADMIN_APPROVALS_PATH);
  return { ok: true };
}
