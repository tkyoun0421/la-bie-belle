"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { requireActiveProfile } from "@/entities/identity/api/require-active-profile";
import { HourlyWageSchema, mapWorkerRpcErrorCode } from "@/entities/identity/model/worker-update";
import { MY_PROFILE_PATH } from "@/shared/config/auth-routes.config";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type SetOwnWageResult =
  { ok: true } | { ok: false; code: ErrorCode; fieldErrors?: { hourlyWage?: string } };

export async function setOwnWage(hourlyWage: number): Promise<SetOwnWageResult> {
  const requireResult = await requireActiveProfile();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return { ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED };
  }

  const { error } = await supabase.rpc("set_hourly_wage", {
    target_profile_id: user.id,
    new_wage: parsed.data.hourlyWage,
  });

  revalidatePath(MY_PROFILE_PATH);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "identity_set_own_wage_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapWorkerRpcErrorCode(error.code) };
  }

  return { ok: true };
}
