"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/entities/identity/api/require-admin";
import {
  SetRequirementInputSchema,
  mapRequirementRpcErrorCode,
  type SetRequirementInput,
} from "@/entities/schedule/model/requirement-manage";
import { ADMIN_SCHEDULE_DETAIL_PATTERN } from "@/shared/config/auth-routes.config";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type SetRequirementResult = { ok: true } | { ok: false; code: ErrorCode };

export async function setRequirement(input: SetRequirementInput): Promise<SetRequirementResult> {
  const requireResult = await requireAdmin();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const parsed = SetRequirementInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_position_requirement", {
    target_schedule_id: parsed.data.scheduleId,
    target_position_id: parsed.data.positionId,
    new_count: parsed.data.requiredCount,
  });

  revalidatePath(ADMIN_SCHEDULE_DETAIL_PATTERN, "layout");

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "scheduling_set_requirement_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapRequirementRpcErrorCode(error.code) };
  }

  return { ok: true };
}
