import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assignmentErrors,
  assignmentErrorCodes,
} from "#/entities/assignments/models/errors/assignmentError";
import type { AssignmentKind } from "#/entities/assignments/models/schemas/assignment";
import type { Database } from "#/shared/types/database";

type AssignmentRepositoryOptions = {
  client: SupabaseClient<Database>;
};

export type CreateAssignmentRecordInput = {
  eventId: string;
  positionId: string;
  userId: string;
  assignmentKind?: AssignmentKind;
};

export async function createAssignmentRecord(
  input: CreateAssignmentRecordInput,
  options: AssignmentRepositoryOptions
): Promise<string> {
  const { client } = options;
  const { data, error } = await client
    .from("assignments")
    .insert({
      assignment_kind: input.assignmentKind ?? "regular",
      event_id: input.eventId,
      position_id: input.positionId,
      status: "assigned",
      user_id: input.userId,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw assignmentErrors.create(assignmentErrorCodes.createDuplicateActive, {
        cause: error,
      });
    }

    throw assignmentErrors.create(assignmentErrorCodes.createFailed, {
      cause: error,
    });
  }

  return data.id;
}
