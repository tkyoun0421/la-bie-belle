import "server-only";

import { normalizeTime } from "@/entities/schedule/model/ceremony-times";
import { RecruitmentScheduleStatusSchema } from "@/entities/schedule/model/recruitment-schedule";
import type { SchedulePrep } from "@/entities/schedule/types/schedule-prep";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type GetSchedulePrepResult =
  { ok: true; data: SchedulePrep | null } | { ok: false; code: ErrorCode };

const FORBIDDEN_PG_CODE = "42501";

type ScheduleRow = {
  id: string;
  work_date: string;
  status: string;
  planned_checkin: string | null;
  planned_checkout: string | null;
};
type CeremonyRow = { starts_at: string };
type CheckInRuleRow = { first_ceremony_at: string; recommended_check_in: string };

function logFailure(event: string, code: string | undefined) {
  process.stderr.write(`${JSON.stringify({ event, code })}\n`);
}

function mapFailureCode(pgCode: string | undefined): ErrorCode {
  if (pgCode === FORBIDDEN_PG_CODE) {
    return ERROR_CODE.IDENTITY_NOT_ACTIVE;
  }
  return ERROR_CODE.COMMON_UNEXPECTED;
}

export async function getSchedulePrep(scheduleId: string): Promise<GetSchedulePrepResult> {
  const supabase = await createSupabaseServerClient();

  const [scheduleResult, ceremoniesResult, rulesResult] = await Promise.all([
    supabase
      .from("schedules")
      .select("id, work_date, status, planned_checkin, planned_checkout")
      .eq("id", scheduleId)
      .maybeSingle(),
    supabase
      .from("ceremonies")
      .select("starts_at")
      .eq("schedule_id", scheduleId)
      .order("starts_at", { ascending: true }),
    supabase
      .from("check_in_rules")
      .select("first_ceremony_at, recommended_check_in")
      .order("first_ceremony_at", { ascending: true }),
  ]);

  if (scheduleResult.error) {
    logFailure("scheduling_get_schedule_prep_schedule_failed", scheduleResult.error.code);
    return { ok: false, code: mapFailureCode(scheduleResult.error.code) };
  }
  if (ceremoniesResult.error) {
    logFailure("scheduling_get_schedule_prep_ceremonies_failed", ceremoniesResult.error.code);
    return { ok: false, code: mapFailureCode(ceremoniesResult.error.code) };
  }
  if (rulesResult.error) {
    logFailure("scheduling_get_schedule_prep_rules_failed", rulesResult.error.code);
    return { ok: false, code: mapFailureCode(rulesResult.error.code) };
  }

  if (scheduleResult.data === null) {
    return { ok: true, data: null };
  }

  const schedule = scheduleResult.data as ScheduleRow;

  return {
    ok: true,
    data: {
      id: schedule.id,
      workDate: schedule.work_date,
      status: RecruitmentScheduleStatusSchema.parse(schedule.status),
      ceremonyTimes: ((ceremoniesResult.data ?? []) as CeremonyRow[]).map((row) =>
        normalizeTime(row.starts_at),
      ),
      plannedCheckin:
        schedule.planned_checkin === null ? null : normalizeTime(schedule.planned_checkin),
      plannedCheckout:
        schedule.planned_checkout === null ? null : normalizeTime(schedule.planned_checkout),
      checkInRules: ((rulesResult.data ?? []) as CheckInRuleRow[]).map((row) => ({
        firstCeremonyAt: normalizeTime(row.first_ceremony_at),
        recommendedCheckIn: normalizeTime(row.recommended_check_in),
      })),
    },
  };
}
