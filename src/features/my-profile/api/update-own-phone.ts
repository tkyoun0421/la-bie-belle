"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { requireActiveProfile } from "@/entities/identity/api/require-active-profile";
import { normalizePhone } from "@/entities/identity/model/signup";
import {
  mapWorkerRpcErrorCode,
  OwnPhoneSchema,
  PHONE_UNIQUE_CONSTRAINT,
} from "@/entities/identity/model/worker-update";
import { MY_PROFILE_PATH } from "@/shared/config/auth-routes.config";
import { ERROR_CODE, ERROR_CODES, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type UpdateOwnPhoneResult =
  { ok: true } | { ok: false; code: ErrorCode; fieldErrors?: { phone?: string } };

export async function updateOwnPhone(phone: string): Promise<UpdateOwnPhoneResult> {
  const requireResult = await requireActiveProfile();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const parsed = OwnPhoneSchema.safeParse({ phone: normalizePhone(phone) });
  if (!parsed.success) {
    return {
      ok: false,
      code: ERROR_CODE.IDENTITY_VALIDATION,
      fieldErrors: { phone: parsed.error.issues[0]?.message },
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_own_phone", { new_phone: parsed.data.phone });

  revalidatePath(MY_PROFILE_PATH);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "identity_update_own_phone_failed", code: error.code })}\n`,
    );
    if (error.code === "23505" && error.message.includes(PHONE_UNIQUE_CONSTRAINT)) {
      return {
        ok: false,
        code: ERROR_CODE.IDENTITY_PHONE_TAKEN,
        fieldErrors: { phone: ERROR_CODES.IDENTITY_PHONE_TAKEN.message },
      };
    }
    return { ok: false, code: mapWorkerRpcErrorCode(error.code) };
  }

  return { ok: true };
}
