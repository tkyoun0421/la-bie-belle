"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { updateAssignmentStatus } from "#/entities/assignments/repositories/writeAssignmentRepository";
import { createReplacementRequest } from "#/entities/replacements/repositories/writeReplacementRepository";
import {
  cancelAssignmentInputSchema,
  type CancelAssignmentInput,
} from "#/mutations/replacements/schemas/cancelAssignment";
import { requireAppActor } from "#/shared/lib/auth/appActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";
import type { Database } from "#/shared/types/database";

type CancelAssignmentDependencies = {
  client?: SupabaseClient<Database>;
  updateStatus?: typeof updateAssignmentStatus;
  createRequest?: typeof createReplacementRequest;
  requireActor?: typeof requireAppActor;
};

export async function cancelAssignmentAndCreateRequestAction(
  input: CancelAssignmentInput,
  dependencies: CancelAssignmentDependencies = {}
) {
  const values = cancelAssignmentInputSchema.parse(input);
  const requireActor = dependencies.requireActor ?? requireAppActor;
  const actor = await requireActor();

  if (actor.role !== "admin" && actor.role !== "manager") {
    throw new Error("Only admins or managers can cancel assignments in this version.");
  }

  const client = dependencies.client ?? createSupabaseAdminClient();
  const updateStatus = dependencies.updateStatus ?? updateAssignmentStatus;
  const createRequest = dependencies.createRequest ?? createReplacementRequest;

  await updateStatus(values.assignmentId, "cancel_requested", { client });

  const requestId = await createRequest(
    {
      cancelledAssignmentId: values.assignmentId,
      positionId: values.positionId,
    },
    { client }
  );

  return {
    assignmentId: values.assignmentId,
    requestId,
  };
}
