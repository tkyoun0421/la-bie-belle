"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/entities/identity/api/require-admin";
import { ADMIN_SCHEDULE_DETAIL_PATTERN } from "@/shared/config/auth-routes.config";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

const ReplacePositionAssignmentsInputSchema = z.object({
  scheduleId: z.string().uuid(),
  positionId: z.string().uuid(),
  profileIds: z.array(z.string().uuid()),
  traineeProfileIds: z.array(z.string().uuid()),
});

export type ReplacePositionAssignmentsInput = z.infer<typeof ReplacePositionAssignmentsInputSchema>;

export type ReplacePositionAssignmentsResult =
  { ok: true; assignedCount: number } | { ok: false; code: ErrorCode };

const FORBIDDEN_PG_CODE = "42501";
const STATUS_CONFLICT_PG_CODE = "LB020";
const NOT_ELIGIBLE_PG_CODE = "LB023";
const TRAINEE_ALREADY_ASSIGNED_PG_CODE = "LB024";
const TRAINEE_DUPLICATE_PG_CODE = "LB025";
const VALIDATION_PG_CODE = "22023";

function mapAssignmentRpcErrorCode(pgCode: string | undefined): ErrorCode {
  if (pgCode === FORBIDDEN_PG_CODE) {
    return ERROR_CODE.IDENTITY_NOT_ACTIVE;
  }
  if (pgCode === STATUS_CONFLICT_PG_CODE) {
    return ERROR_CODE.SCHEDULING_STATUS_CONFLICT;
  }
  if (pgCode === NOT_ELIGIBLE_PG_CODE) {
    return ERROR_CODE.SCHEDULING_ASSIGNMENT_NOT_ELIGIBLE;
  }
  if (pgCode === TRAINEE_ALREADY_ASSIGNED_PG_CODE) {
    return ERROR_CODE.SCHEDULING_TRAINEE_ALREADY_ASSIGNED;
  }
  if (pgCode === TRAINEE_DUPLICATE_PG_CODE) {
    return ERROR_CODE.SCHEDULING_TRAINEE_DUPLICATE;
  }
  if (pgCode === VALIDATION_PG_CODE) {
    return ERROR_CODE.SCHEDULING_VALIDATION;
  }
  return ERROR_CODE.COMMON_UNEXPECTED;
}

type ReplaceAssignmentsRpcPayload = { assigned_count: number; changed: boolean };
type ReplaceAssignmentsRpcResponse = {
  data: ReplaceAssignmentsRpcPayload | null;
  error: { code?: string; message: string } | null;
};

export async function replacePositionAssignments(
  input: ReplacePositionAssignmentsInput,
): Promise<ReplacePositionAssignmentsResult> {
  const requireResult = await requireAdmin();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const parsed = ReplacePositionAssignmentsInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = (await supabase.rpc("replace_position_assignments", {
    target_schedule_id: parsed.data.scheduleId,
    target_position_id: parsed.data.positionId,
    profile_ids: parsed.data.profileIds,
    trainee_profile_ids: parsed.data.traineeProfileIds,
  })) as ReplaceAssignmentsRpcResponse;

  revalidatePath(ADMIN_SCHEDULE_DETAIL_PATTERN, "layout");

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "assignment_replace_position_assignments_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapAssignmentRpcErrorCode(error.code) };
  }

  const payload = data as ReplaceAssignmentsRpcPayload;
  return { ok: true, assignedCount: payload.assigned_count };
}
