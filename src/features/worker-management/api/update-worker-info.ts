"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/entities/identity/api/require-admin";
import { normalizePhone } from "@/entities/identity/model/signup";
import {
  createWorkerPersonalInfoSchema,
  mapWorkerRpcErrorCode,
  PHONE_UNIQUE_CONSTRAINT,
  toWorkerPersonalInfoFieldErrors,
  type WorkerPersonalInfoFieldName,
} from "@/entities/identity/model/worker-update";
import { ADMIN_WORKERS_PATH } from "@/shared/config/auth-routes.config";
import { ERROR_CODE, ERROR_CODES, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

const TargetIdSchema = z.string().uuid();

export type UpdateWorkerInfoInput = {
  name: string;
  phone: string;
  gender: string;
  birthDate: string;
};

export type UpdateWorkerInfoResult =
  | { ok: true }
  | {
      ok: false;
      code: ErrorCode;
      fieldErrors?: Partial<Record<WorkerPersonalInfoFieldName, string>>;
    };

export async function updateWorkerInfo(
  targetProfileId: string,
  input: UpdateWorkerInfoInput,
): Promise<UpdateWorkerInfoResult> {
  const requireResult = await requireAdmin();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const targetParsed = TargetIdSchema.safeParse(targetProfileId);
  if (!targetParsed.success) {
    return { ok: false, code: ERROR_CODE.IDENTITY_VALIDATION };
  }

  const normalizedInput = { ...input, phone: normalizePhone(input.phone) };
  const parsed = createWorkerPersonalInfoSchema().safeParse(normalizedInput);
  if (!parsed.success) {
    return {
      ok: false,
      code: ERROR_CODE.IDENTITY_VALIDATION,
      fieldErrors: toWorkerPersonalInfoFieldErrors(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_worker_info", {
    target_profile_id: targetParsed.data,
    new_name: parsed.data.name,
    new_gender: parsed.data.gender,
    new_birth_date: parsed.data.birthDate,
    new_phone: parsed.data.phone,
  });

  revalidatePath(ADMIN_WORKERS_PATH);
  revalidatePath(`${ADMIN_WORKERS_PATH}/${targetParsed.data}`);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "identity_update_worker_info_failed", code: error.code })}\n`,
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
