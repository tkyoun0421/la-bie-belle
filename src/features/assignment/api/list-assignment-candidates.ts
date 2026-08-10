"use server";

import "server-only";

import { z } from "zod";

import { listPositionAssignmentCandidates } from "@/entities/assignment/api/list-position-assignment-candidates";
import type { AssignmentCandidate } from "@/entities/assignment/types/candidate";
import { requireAdmin } from "@/entities/identity/api/require-admin";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";

const ListAssignmentCandidatesInputSchema = z.object({
  scheduleId: z.string().uuid(),
  positionId: z.string().uuid(),
});

export type ListAssignmentCandidatesInput = z.infer<typeof ListAssignmentCandidatesInputSchema>;

export type ListAssignmentCandidatesResult =
  { ok: true; candidates: AssignmentCandidate[] } | { ok: false; code: ErrorCode };

export async function listAssignmentCandidates(
  input: ListAssignmentCandidatesInput,
): Promise<ListAssignmentCandidatesResult> {
  const requireResult = await requireAdmin();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const parsed = ListAssignmentCandidatesInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION };
  }

  const result = await listPositionAssignmentCandidates({
    scheduleId: parsed.data.scheduleId,
    positionId: parsed.data.positionId,
  });

  if (!result.ok) {
    return { ok: false, code: result.code };
  }

  return { ok: true, candidates: result.data };
}
