"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/entities/identity/api/require-admin";
import { mapWorkerRpcErrorCode } from "@/entities/identity/model/worker-update";
import { ADMIN_WORKERS_PATH } from "@/shared/config/auth-routes.config";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

const IdSchema = z.string().uuid();

export type GrantPositionResult = { ok: true } | { ok: false; code: ErrorCode };

export async function grantPosition(
  targetProfileId: string,
  positionId: string,
): Promise<GrantPositionResult> {
  const requireResult = await requireAdmin();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const targetParsed = IdSchema.safeParse(targetProfileId);
  const positionParsed = IdSchema.safeParse(positionId);
  if (!targetParsed.success || !positionParsed.success) {
    return { ok: false, code: ERROR_CODE.IDENTITY_VALIDATION };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("grant_position_eligibility", {
    target_profile_id: targetParsed.data,
    target_position_id: positionParsed.data,
  });

  revalidatePath(`${ADMIN_WORKERS_PATH}/${targetParsed.data}`);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "identity_grant_position_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapWorkerRpcErrorCode(error.code) };
  }

  return { ok: true };
}
