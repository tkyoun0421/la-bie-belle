import "server-only";

import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type CountScheduleRequirementsResult =
  { ok: true; count: number } | { ok: false; code: ErrorCode };

const FORBIDDEN_PG_CODE = "42501";

function mapFailureCode(pgCode: string | undefined): ErrorCode {
  if (pgCode === FORBIDDEN_PG_CODE) {
    return ERROR_CODE.IDENTITY_NOT_ACTIVE;
  }
  return ERROR_CODE.COMMON_UNEXPECTED;
}

export async function countScheduleRequirements(
  scheduleId: string,
): Promise<CountScheduleRequirementsResult> {
  const supabase = await createSupabaseServerClient();

  const { count, error } = await supabase
    .from("schedule_position_requirements")
    .select("position_id", { count: "exact", head: true })
    .eq("schedule_id", scheduleId);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "scheduling_count_schedule_requirements_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapFailureCode(error.code) };
  }

  return { ok: true, count: count ?? 0 };
}
