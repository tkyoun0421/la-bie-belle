"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/entities/identity/api/require-admin";
import { HourlyWageSchema, mapWorkerRpcErrorCode } from "@/entities/identity/model/worker-update";
import { ADMIN_WORKERS_PATH } from "@/shared/config/auth-routes.config";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

const TargetIdSchema = z.string().uuid();

export type SetHourlyWageResult =
  { ok: true } | { ok: false; code: ErrorCode; fieldErrors?: { hourlyWage?: string } };

export async function setHourlyWage(
  targetProfileId: string,
  hourlyWage: number,
): Promise<SetHourlyWageResult> {
  const requireResult = await requireAdmin();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const targetParsed = TargetIdSchema.safeParse(targetProfileId);
  if (!targetParsed.success) {
    return { ok: false, code: ERROR_CODE.IDENTITY_VALIDATION };
  }

  const parsed = HourlyWageSchema.safeParse({ hourlyWage });
  if (!parsed.success) {
    return {
      ok: false,
      code: ERROR_CODE.IDENTITY_VALIDATION,
      fieldErrors: { hourlyWage: parsed.error.issues[0]?.message },
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_hourly_wage", {
    target_profile_id: targetParsed.data,
    new_wage: parsed.data.hourlyWage,
  });

  revalidatePath(ADMIN_WORKERS_PATH);
  revalidatePath(`${ADMIN_WORKERS_PATH}/${targetParsed.data}`);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "identity_set_hourly_wage_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapWorkerRpcErrorCode(error.code) };
  }

  return { ok: true };
}
