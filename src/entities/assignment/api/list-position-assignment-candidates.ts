import "server-only";

import type {
  AssignmentCandidate,
  AssignmentIneligibleReason,
} from "@/entities/assignment/types/candidate";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type ListPositionAssignmentCandidatesParams = { scheduleId: string; positionId: string };

export type ListPositionAssignmentCandidatesResult =
  { ok: true; data: AssignmentCandidate[] } | { ok: false; code: ErrorCode };

const FORBIDDEN_PG_CODE = "42501";

type CandidateRow = {
  profile_id: string;
  name: string;
  applied: boolean;
  currently_assigned: boolean;
  other_position_names: string[] | null;
  eligible: boolean;
  ineligible_reason: string | null;
  currently_trainee: boolean;
};

function isIneligibleReason(value: string | null): value is AssignmentIneligibleReason {
  return value === "GENDER_MISMATCH" || value === "NOT_ELIGIBLE";
}

export async function listPositionAssignmentCandidates(
  params: ListPositionAssignmentCandidatesParams,
): Promise<ListPositionAssignmentCandidatesResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = (await supabase.rpc("list_position_assignment_candidates", {
    target_schedule_id: params.scheduleId,
    target_position_id: params.positionId,
  })) as { data: CandidateRow[] | null; error: { code?: string; message: string } | null };

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "assignment_list_position_assignment_candidates_failed", code: error.code })}\n`,
    );
    if (error.code === FORBIDDEN_PG_CODE) {
      return { ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE };
    }
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  return {
    ok: true,
    data: (data ?? []).map((row) => ({
      profileId: row.profile_id,
      name: row.name,
      applied: row.applied,
      currentlyAssigned: row.currently_assigned,
      otherPositionNames: row.other_position_names ?? [],
      eligible: row.eligible,
      ineligibleReason: isIneligibleReason(row.ineligible_reason) ? row.ineligible_reason : null,
      currentlyTrainee: row.currently_trainee,
    })),
  };
}
