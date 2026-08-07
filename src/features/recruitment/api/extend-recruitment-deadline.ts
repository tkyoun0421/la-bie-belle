"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/entities/identity/api/require-admin";
import {
  RecruitmentManageInputSchema,
  mapRecruitmentManageRpcErrorCode,
} from "@/entities/schedule/model/recruitment-manage";
import { ADMIN_RECRUITMENT_PATH } from "@/shared/config/auth-routes.config";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type ExtendRecruitmentDeadlineInput = { scheduleId: string; newDeadline: string };

export type ExtendRecruitmentDeadlineResult = { ok: true } | { ok: false; code: ErrorCode };

export async function extendRecruitmentDeadline(
  input: ExtendRecruitmentDeadlineInput,
): Promise<ExtendRecruitmentDeadlineResult> {
  const requireResult = await requireAdmin();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const parsed = RecruitmentManageInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("extend_recruitment_deadline", {
    target_schedule_id: parsed.data.scheduleId,
    new_deadline: parsed.data.newDeadline,
  });

  revalidatePath(ADMIN_RECRUITMENT_PATH);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "recruitment_extend_deadline_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapRecruitmentManageRpcErrorCode(error.code) };
  }

  return { ok: true };
}
