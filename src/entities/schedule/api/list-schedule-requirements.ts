import "server-only";

import type { ScheduleRequirementRow } from "@/entities/schedule/types/schedule-requirement";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type ListScheduleRequirementsResult =
  { ok: true; data: ScheduleRequirementRow[] } | { ok: false; code: ErrorCode };

const LIST_REQUIREMENTS_LIMIT = 1000;
const FORBIDDEN_PG_CODE = "42501";

type RequirementRow = {
  position_id: string;
  required_count: number;
  positions: { name: string } | null;
};

export async function listScheduleRequirements(
  scheduleId: string,
): Promise<ListScheduleRequirementsResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("schedule_position_requirements")
    .select("position_id, required_count, positions(name)")
    .eq("schedule_id", scheduleId)
    .order("position_id", { ascending: true })
    .limit(LIST_REQUIREMENTS_LIMIT);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "scheduling_list_schedule_requirements_failed", code: error.code })}\n`,
    );
    if (error.code === FORBIDDEN_PG_CODE) {
      return { ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE };
    }
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  return {
    ok: true,
    data: ((data ?? []) as unknown as RequirementRow[])
      .filter(
        (row): row is RequirementRow & { positions: { name: string } } => row.positions !== null,
      )
      .map((row) => ({
        positionId: row.position_id,
        positionName: row.positions.name,
        requiredCount: row.required_count,
      })),
  };
}
