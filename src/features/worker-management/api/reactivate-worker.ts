"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/entities/identity/api/require-admin";
import { mapDormancyRpcErrorCode } from "@/entities/identity/model/dormancy";
import { ADMIN_WORKERS_PATH } from "@/shared/config/auth-routes.config";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

const IdSchema = z.string().uuid();

export type ReactivateWorkerResult = { ok: true } | { ok: false; code: ErrorCode };

export async function reactivateWorker(targetProfileId: string): Promise<ReactivateWorkerResult> {
  const requireResult = await requireAdmin();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const targetParsed = IdSchema.safeParse(targetProfileId);
  if (!targetParsed.success) {
    return { ok: false, code: ERROR_CODE.IDENTITY_VALIDATION };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("reactivate_worker", {
    target_profile_id: targetParsed.data,
  });

  revalidatePath(`${ADMIN_WORKERS_PATH}/${targetParsed.data}`);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "identity_reactivate_worker_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapDormancyRpcErrorCode(error.code) };
  }

  return { ok: true };
}
