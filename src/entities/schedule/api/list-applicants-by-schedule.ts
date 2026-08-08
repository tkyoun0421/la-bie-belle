import "server-only";

import type { ScheduleApplicant } from "@/entities/schedule/model/schedule-applicant";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type ListApplicantsByScheduleParams = { scheduleId: string };

export type ListApplicantsByScheduleResult =
  { ok: true; data: ScheduleApplicant[] } | { ok: false; code: ErrorCode };

const FORBIDDEN_PG_CODE = "42501";

type ApplicantRow = { profiles: { name: string } | null };

export async function listApplicantsBySchedule(
  params: ListApplicantsByScheduleParams,
): Promise<ListApplicantsByScheduleResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("applications")
    .select("profiles!applications_profile_id_fkey(name)")
    .eq("schedule_id", params.scheduleId)
    .eq("status", "applied");

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "scheduling_list_applicants_by_schedule_failed", code: error.code })}\n`,
    );
    if (error.code === FORBIDDEN_PG_CODE) {
      return { ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE };
    }
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  return {
    ok: true,
    data: ((data ?? []) as unknown as ApplicantRow[])
      .filter((row): row is { profiles: { name: string } } => row.profiles !== null)
      .map((row) => ({ name: row.profiles.name })),
  };
}
