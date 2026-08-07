"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/entities/identity/api/require-admin";
import {
  RecruitmentOpenInputSchema,
  mapRecruitmentRpcErrorCode,
} from "@/entities/schedule/model/recruitment-open";
import { ADMIN_RECRUITMENT_PATH } from "@/shared/config/auth-routes.config";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type OpenRecruitmentSchedulesInput = {
  dates: string[];
  applicationDeadline: string;
};

export type OpenRecruitmentSchedulesResult =
  { ok: true; createdCount: number } | { ok: false; code: ErrorCode; conflictDates?: string[] };

type OpenRecruitmentSchedulesRpcPayload = {
  created_count: number;
  conflict_dates: string[];
};

type OpenRecruitmentSchedulesRpcResponse = {
  data: OpenRecruitmentSchedulesRpcPayload | null;
  error: { code?: string } | null;
};

export async function openRecruitmentSchedules(
  input: OpenRecruitmentSchedulesInput,
): Promise<OpenRecruitmentSchedulesResult> {
  const requireResult = await requireAdmin();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const parsed = RecruitmentOpenInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = (await supabase.rpc("open_recruitment_schedules", {
    work_dates: parsed.data.dates,
    application_deadline: parsed.data.applicationDeadline,
  })) as OpenRecruitmentSchedulesRpcResponse;

  revalidatePath(ADMIN_RECRUITMENT_PATH);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "recruitment_open_schedules_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapRecruitmentRpcErrorCode(error.code) };
  }

  const payload = data as OpenRecruitmentSchedulesRpcPayload;
  if (payload.conflict_dates.length > 0) {
    return {
      ok: false,
      code: ERROR_CODE.SCHEDULING_DATE_CONFLICT,
      conflictDates: payload.conflict_dates,
    };
  }

  return { ok: true, createdCount: payload.created_count };
}
