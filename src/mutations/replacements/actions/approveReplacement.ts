"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { updateAssignmentStatus, createAssignmentRecord } from "#/entities/assignments/repositories/writeAssignmentRepository";
import { readReplacementRequestById } from "#/entities/replacements/repositories/readReplacementRepository";
import { updateReplacementRequestStatus } from "#/entities/replacements/repositories/writeReplacementRepository";
import {
  replacementErrors,
  replacementErrorCodes,
} from "#/entities/replacements/models/errors/replacementError";
import {
  approveReplacementInputSchema,
  type ApproveReplacementInput,
} from "#/mutations/replacements/schemas/approveReplacement";
import { requireAppActor } from "#/shared/lib/auth/appActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";
import type { Database } from "#/shared/types/database";

type ApproveReplacementDependencies = {
  client?: SupabaseClient<Database>;
  readRequest?: typeof readReplacementRequestById;
  updateRequestStatus?: typeof updateReplacementRequestStatus;
  updateAssignmentStatus?: typeof updateAssignmentStatus;
  createAssignment?: typeof createAssignmentRecord;
  requireActor?: typeof requireAppActor;
};

export async function approveReplacementAction(
  input: ApproveReplacementInput,
  dependencies: ApproveReplacementDependencies = {}
) {
  const values = approveReplacementInputSchema.parse(input);
  const requireActor = dependencies.requireActor ?? requireAppActor;
  const actor = await requireActor();

  if (actor.role !== "admin" && actor.role !== "manager") {
    throw replacementErrors.create(replacementErrorCodes.unauthorizedRole);
  }

  const client = dependencies.client ?? createSupabaseAdminClient();
  const readRequest = dependencies.readRequest ?? readReplacementRequestById;
  const updateRequestStatus = dependencies.updateRequestStatus ?? updateReplacementRequestStatus;
  const updateStatus = dependencies.updateAssignmentStatus ?? updateAssignmentStatus;
  const createAssignment = dependencies.createAssignment ?? createAssignmentRecord;

  const request = await readRequest(values.replacementRequestId, { client });

  if (!request) {
    throw replacementErrors.create(replacementErrorCodes.requestNotFound);
  }

  if (request.status !== "open" && request.status !== "pending_manager_approval") {
    throw replacementErrors.create(replacementErrorCodes.requestAlreadyProcessed);
  }

  // Use the cancelled assignment ID to find the event ID
  const { data: cancelledAssignment, error: assignmentError } = await client
    .from("assignments")
    .select("event_id")
    .eq("id", request.cancelledAssignmentId)
    .single();

  if (assignmentError || !cancelledAssignment) {
    throw replacementErrors.create(replacementErrorCodes.cancelledAssignmentNotFound);
  }

  const newAssignmentId = await createAssignment(
    {
      eventId: cancelledAssignment.event_id,
      positionId: request.positionId,
      userId: values.userId,
      assignmentKind: "regular",
    },
    { client }
  );

  await updateStatus(request.cancelledAssignmentId, "cancelled", { client });

  await updateRequestStatus(
    values.replacementRequestId,
    "approved",
    {
      client,
      approvedAssignmentId: newAssignmentId,
      closedBy: actor.userId,
    }
  );

  return {
    requestId: values.replacementRequestId,
    newAssignmentId,
  };
}
