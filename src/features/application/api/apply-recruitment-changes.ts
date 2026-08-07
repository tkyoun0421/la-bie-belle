"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import {
  ApplicationChangesInputSchema,
  mapApplicationRpcErrorCode,
} from "@/entities/schedule/model/application-changes";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

const SCHEDULE_PATH = "/schedule";

export type ApplyRecruitmentChangesInput = {
  applyScheduleIds: string[];
  withdrawScheduleIds: string[];
};

export type ApplyRecruitmentChangesResult =
  | { ok: true; appliedCount: number; withdrawnCount: number }
  | { ok: false; code: ErrorCode; blockedDates?: string[] };

type ApplyRecruitmentChangesRpcPayload = {
  applied_count: number;
  withdrawn_count: number;
  blocked_dates: string[];
};

type ApplyRecruitmentChangesRpcResponse = {
  data: ApplyRecruitmentChangesRpcPayload | null;
  error: { code?: string } | null;
};

export async function applyRecruitmentChanges(
  input: ApplyRecruitmentChangesInput,
): Promise<ApplyRecruitmentChangesResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return { ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED };
  }

  const parsed = ApplicationChangesInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION };
  }

  const { data, error } = (await supabase.rpc("apply_recruitment_changes", {
    apply_schedule_ids: parsed.data.applyScheduleIds,
    withdraw_schedule_ids: parsed.data.withdrawScheduleIds,
  })) as ApplyRecruitmentChangesRpcResponse;

  revalidatePath(SCHEDULE_PATH);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "scheduling_apply_recruitment_changes_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapApplicationRpcErrorCode(error.code) };
  }

  const payload = data as ApplyRecruitmentChangesRpcPayload;
  if (payload.blocked_dates.length > 0) {
    return {
      ok: false,
      code: ERROR_CODE.SCHEDULING_APPLICATION_BLOCKED,
      blockedDates: payload.blocked_dates,
    };
  }

  return {
    ok: true,
    appliedCount: payload.applied_count,
    withdrawnCount: payload.withdrawn_count,
  };
}
