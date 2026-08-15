"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/entities/identity/api/require-admin";
import { ADMIN_SCHEDULE_DETAIL_PATTERN } from "@/shared/config/auth-routes.config";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

const CancelScheduleInputSchema = z.object({
  scheduleId: z.string().uuid(),
});

export type CancelScheduleInput = z.infer<typeof CancelScheduleInputSchema>;

export type CancelScheduleResult =
  { ok: true; data: { revision: number } } | { ok: false; code: ErrorCode };

const FORBIDDEN_PG_CODE = "42501";
const INVALID_STATUS_PG_CODE = "LB032";
const VALIDATION_PG_CODE = "22023";

function mapCancelScheduleErrorCode(pgCode: string | undefined): ErrorCode {
  if (pgCode === FORBIDDEN_PG_CODE) {
    return ERROR_CODE.IDENTITY_NOT_ACTIVE;
  }
  if (pgCode === INVALID_STATUS_PG_CODE) {
    return ERROR_CODE.SCHEDULING_CANCEL_INVALID_STATUS;
  }
  if (pgCode === VALIDATION_PG_CODE) {
    return ERROR_CODE.SCHEDULING_VALIDATION;
  }
  return ERROR_CODE.COMMON_UNEXPECTED;
}

type CancelScheduleRpcPayload = { revision: number };
type CancelScheduleRpcResponse = {
  data: CancelScheduleRpcPayload | null;
  error: { code?: string; message: string } | null;
};

export async function cancelSchedule(input: CancelScheduleInput): Promise<CancelScheduleResult> {
  const requireResult = await requireAdmin();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const parsed = CancelScheduleInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = (await supabase.rpc("cancel_confirmed_schedule", {
    target_schedule_id: parsed.data.scheduleId,
  })) as CancelScheduleRpcResponse;

  revalidatePath(ADMIN_SCHEDULE_DETAIL_PATTERN, "layout");

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "confirmation_cancel_schedule_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapCancelScheduleErrorCode(error.code) };
  }

  const payload = data as CancelScheduleRpcPayload;
  return { ok: true, data: { revision: payload.revision } };
}
