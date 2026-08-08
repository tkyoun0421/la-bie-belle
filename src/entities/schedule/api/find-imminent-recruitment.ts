import "server-only";

import { listOwnApplications } from "@/entities/schedule/api/list-own-applications";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

const CANDIDATE_FETCH_LIMIT = 50;

export type ImminentRecruitmentCandidate = {
  scheduleId: string;
  workDate: string;
  applicationDeadline: string;
  applied: boolean;
};

export type FindImminentRecruitmentParams = { today: string };

export type FindImminentRecruitmentResult =
  { ok: true; data: ImminentRecruitmentCandidate[] } | { ok: false; code: ErrorCode };

type UpcomingScheduleRow = { id: string; work_date: string; application_deadline: string };

export async function findImminentRecruitment(
  params: FindImminentRecruitmentParams,
): Promise<FindImminentRecruitmentResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("schedules")
    .select("id, work_date, application_deadline")
    .eq("status", "OPEN")
    .gte("application_deadline", params.today)
    .order("application_deadline", { ascending: true })
    .limit(CANDIDATE_FETCH_LIMIT);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "scheduling_find_imminent_recruitment_failed", code: error.code })}\n`,
    );
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  const schedules = (data ?? []) as UpcomingScheduleRow[];
  if (schedules.length === 0) {
    return { ok: true, data: [] };
  }

  const applicationsResult = await listOwnApplications({
    scheduleIds: schedules.map((schedule) => schedule.id),
  });
  if (!applicationsResult.ok) {
    return { ok: false, code: applicationsResult.code };
  }

  const appliedScheduleIds = new Set(
    applicationsResult.data
      .filter((application) => application.status === "applied")
      .map((application) => application.scheduleId),
  );

  return {
    ok: true,
    data: schedules.map((schedule) => ({
      scheduleId: schedule.id,
      workDate: schedule.work_date,
      applicationDeadline: schedule.application_deadline,
      applied: appliedScheduleIds.has(schedule.id),
    })),
  };
}
