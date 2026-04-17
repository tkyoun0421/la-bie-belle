"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assignmentErrors,
  assignmentErrorCodes,
} from "#/entities/assignments/models/errors/assignmentError";
import { createAssignmentRecord } from "#/entities/assignments/repositories/writeAssignmentRepository";
import { readEventById } from "#/entities/events/repositories/readEventRepository";
import {
  parseCreateAssignmentInput,
  type CreateAssignmentInput,
} from "#/mutations/assignments/schemas/createAssignment";
import { requireAppActor } from "#/shared/lib/auth/appActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";
import type { Database } from "#/shared/types/database";

type CreateAssignmentDependencies = {
  client?: SupabaseClient<Database>;
  createRecord?: typeof createAssignmentRecord;
  readEvent?: typeof readEventById;
  requireActor?: typeof requireAppActor;
};

export async function createAssignmentAction(
  input: CreateAssignmentInput,
  dependencies: CreateAssignmentDependencies = {}
) {
  const values = parseCreateAssignmentInput(input);
  const requireActor = dependencies.requireActor ?? requireAppActor;
  const actor = await requireActor();

  if (actor.role !== "admin" && actor.role !== "manager") {
    throw assignmentErrors.create(assignmentErrorCodes.unauthorizedRole);
  }

  const client = dependencies.client ?? createSupabaseAdminClient();
  const readEvent = dependencies.readEvent ?? readEventById;
  const createRecord = dependencies.createRecord ?? createAssignmentRecord;

  const event = await readEvent(values.eventId, { client });

  if (!event) {
    throw assignmentErrors.create(assignmentErrorCodes.createEventNotFound);
  }

  const positionInEvent = event.positionSlots.some(
    (slot) => slot.positionId === values.positionId
  );

  if (!positionInEvent) {
    throw assignmentErrors.create(assignmentErrorCodes.createPositionNotInEvent);
  }

  const assignmentId = await createRecord(
    {
      eventId: values.eventId,
      positionId: values.positionId,
      userId: values.userId,
      assignmentKind: values.assignmentKind,
    },
    { client }
  );

  return {
    assignmentId,
    eventId: values.eventId,
    positionId: values.positionId,
    userId: values.userId,
  };
}
