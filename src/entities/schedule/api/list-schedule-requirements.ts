import "server-only";

import type { ScheduleRequirementRow } from "@/entities/schedule/types/schedule-requirement";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type ListScheduleRequirementsResult =
  | {
      ok: true;
      data: ScheduleRequirementRow[];
      assignedCounts: Record<string, number>;
      assignedWorkerCount: number;
      traineeCounts: Record<string, number>;
    }
  | { ok: false; code: ErrorCode };

const LIST_REQUIREMENTS_LIMIT = 1000;
const FORBIDDEN_PG_CODE = "42501";

type RequirementRow = {
  position_id: string;
  required_count: number;
  positions: { name: string } | null;
};

type AssignmentRow = { assignment_positions: { position_id: string }[] | null };
type TraineeRow = { position_id: string };

function mapFailureCode(pgCode: string | undefined): ErrorCode {
  if (pgCode === FORBIDDEN_PG_CODE) {
    return ERROR_CODE.IDENTITY_NOT_ACTIVE;
  }
  return ERROR_CODE.COMMON_UNEXPECTED;
}

function countAssignedPositions(rows: AssignmentRow[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    for (const position of row.assignment_positions ?? []) {
      counts[position.position_id] = (counts[position.position_id] ?? 0) + 1;
    }
  }
  return counts;
}

function countTrainees(rows: TraineeRow[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.position_id] = (counts[row.position_id] ?? 0) + 1;
  }
  return counts;
}

export async function listScheduleRequirements(
  scheduleId: string,
): Promise<ListScheduleRequirementsResult> {
  const supabase = await createSupabaseServerClient();

  const [requirementsResult, assignmentsResult, traineesResult] = await Promise.all([
    supabase
      .from("schedule_position_requirements")
      .select("position_id, required_count, positions(name)")
      .eq("schedule_id", scheduleId)
      .order("position_id", { ascending: true })
      .limit(LIST_REQUIREMENTS_LIMIT),
    supabase
      .from("assignments")
      .select("assignment_positions(position_id)")
      .eq("schedule_id", scheduleId)
      .limit(LIST_REQUIREMENTS_LIMIT),
    supabase
      .from("assignment_trainees")
      .select("position_id")
      .eq("schedule_id", scheduleId)
      .limit(LIST_REQUIREMENTS_LIMIT),
  ]);

  if (requirementsResult.error) {
    process.stderr.write(
      `${JSON.stringify({ event: "scheduling_list_schedule_requirements_failed", code: requirementsResult.error.code })}\n`,
    );
    return { ok: false, code: mapFailureCode(requirementsResult.error.code) };
  }
  if (assignmentsResult.error) {
    process.stderr.write(
      `${JSON.stringify({ event: "scheduling_list_schedule_requirements_assigned_counts_failed", code: assignmentsResult.error.code })}\n`,
    );
    return { ok: false, code: mapFailureCode(assignmentsResult.error.code) };
  }
  if (traineesResult.error) {
    process.stderr.write(
      `${JSON.stringify({ event: "scheduling_list_schedule_requirements_trainee_counts_failed", code: traineesResult.error.code })}\n`,
    );
    return { ok: false, code: mapFailureCode(traineesResult.error.code) };
  }

  const assignmentRows = (assignmentsResult.data ?? []) as unknown as AssignmentRow[];
  const traineeRows = (traineesResult.data ?? []) as unknown as TraineeRow[];

  return {
    ok: true,
    data: ((requirementsResult.data ?? []) as unknown as RequirementRow[])
      .filter(
        (row): row is RequirementRow & { positions: { name: string } } => row.positions !== null,
      )
      .map((row) => ({
        positionId: row.position_id,
        positionName: row.positions.name,
        requiredCount: row.required_count,
      })),
    assignedCounts: countAssignedPositions(assignmentRows),
    assignedWorkerCount: assignmentRows.length,
    traineeCounts: countTrainees(traineeRows),
  };
}
