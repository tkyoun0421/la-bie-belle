import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assignmentErrors,
  assignmentErrorCodes,
} from "#/entities/assignments/models/errors/assignmentError";
import {
  assignmentSchema,
  type Assignment,
} from "#/entities/assignments/models/schemas/assignment";
import {
  applicantSchema,
  type Applicant,
} from "#/entities/assignments/models/schemas/applicant";
import type { Database } from "#/shared/types/database";

type AssignmentRepositoryOptions = {
  client: SupabaseClient<Database>;
};

export async function readEventAssignments(
  eventId: string,
  options: AssignmentRepositoryOptions
): Promise<Assignment[]> {
  const { client } = options;
  const { data, error } = await client
    .from("assignments")
    .select(
      `
      id,
      event_id,
      user_id,
      position_id,
      assignment_kind,
      status,
      assigned_at,
      users (
        id,
        name
      ),
      positions (
        id,
        name
      )
    `
    )
    .eq("event_id", eventId)
    .in("status", ["assigned", "confirmed", "cancel_requested", "checked_in"])
    .order("assigned_at", { ascending: true });

  if (error) {
    throw assignmentErrors.create(assignmentErrorCodes.listFailed, {
      cause: error,
    });
  }

  return (data ?? []).map((row) =>
    assignmentSchema.parse({
      assignedAt: row.assigned_at,
      assignmentKind: row.assignment_kind,
      eventId: row.event_id,
      id: row.id,
      positionId: row.position_id,
      positionName: (row.positions as { name: string } | null)?.name ?? "",
      status: row.status,
      userId: row.user_id,
      userName: (row.users as { name: string } | null)?.name ?? "",
    })
  );
}

export async function readUserIdsWithConflictsOnDate(
  date: string,
  excludedEventId: string,
  options: AssignmentRepositoryOptions
): Promise<Set<string>> {
  const { client } = options;
  const { data, error } = await client
    .from("assignments")
    .select(
      `
      user_id,
      event_id,
      events!inner (
        event_date
      )
    `
    )
    .eq("events.event_date", date)
    .in("status", ["assigned", "confirmed", "cancel_requested", "checked_in"]);

  if (error) {
    throw assignmentErrors.create(assignmentErrorCodes.listFailed, {
      cause: error,
    });
  }

  return new Set(
    (data ?? [])
      .filter((row) => row.event_id !== excludedEventId)
      .map((row) => row.user_id)
  );
}

export async function readEventApplicants(
  eventId: string,
  options: AssignmentRepositoryOptions
): Promise<Applicant[]> {
  const { client } = options;

  const { data: eventData, error: eventError } = await client
    .from("events")
    .select("event_date")
    .eq("id", eventId)
    .single();

  if (eventError || !eventData) {
    throw assignmentErrors.create(assignmentErrorCodes.listFailed, {
      cause: eventError,
    });
  }

  const userIdsWithConflict = await readUserIdsWithConflictsOnDate(
    eventData.event_date,
    eventId,
    options
  );

  const { data, error } = await client
    .from("applications")
    .select(
      `
      id,
      user_id,
      applied_at,
      users (
        id,
        name,
        email
      )
    `
    )
    .eq("event_id", eventId)
    .eq("status", "applied")
    .order("applied_at", { ascending: true });

  if (error) {
    throw assignmentErrors.create(assignmentErrorCodes.listFailed, {
      cause: error,
    });
  }

  return (data ?? []).map((row) => {
    const user = row.users as { id: string; name: string; email: string } | null;

    return applicantSchema.parse({
      applicationId: row.id,
      userId: row.user_id,
      userName: user?.name ?? "",
      userEmail: user?.email ?? "",
      appliedAt: row.applied_at,
      hasConflict: userIdsWithConflict.has(row.user_id),
    });
  });
}
