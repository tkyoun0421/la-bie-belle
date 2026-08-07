import "server-only";

import { endOfMonth, format, startOfMonth } from "date-fns";

import {
  mapRecruitmentScheduleRow,
  type RecruitmentSchedule,
  type RecruitmentScheduleRow,
} from "@/entities/schedule/model/recruitment-schedule";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

const RANGE_DATE_FORMAT = "yyyy-MM-dd";

export type ListRecruitmentSchedulesParams = { month: Date };

export type ListRecruitmentSchedulesResult =
  { ok: true; data: RecruitmentSchedule[] } | { ok: false; code: ErrorCode };

export async function listRecruitmentSchedules(
  params: ListRecruitmentSchedulesParams,
): Promise<ListRecruitmentSchedulesResult> {
  const supabase = await createSupabaseServerClient();
  const from = format(startOfMonth(params.month), RANGE_DATE_FORMAT);
  const to = format(endOfMonth(params.month), RANGE_DATE_FORMAT);

  const { data, error } = await supabase
    .from("schedules")
    .select("id, work_date, application_deadline, status")
    .gte("work_date", from)
    .lte("work_date", to)
    .order("work_date", { ascending: true });

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "scheduling_list_recruitment_schedules_failed", code: error.code })}\n`,
    );
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  return {
    ok: true,
    data: ((data ?? []) as RecruitmentScheduleRow[]).map(mapRecruitmentScheduleRow),
  };
}
