import { z } from "zod";
import { assignmentSchema } from "#/entities/assignments/models/schemas/assignment";
import { createAppError, readApiErrorCode } from "#/shared/lib/errors/appError";

const eventAssignmentsResponseSchema = z.object({
  assignments: z.array(assignmentSchema),
});

export async function fetchEventAssignments(eventId: string) {
  const response = await fetch(`/api/events/${eventId}/assignments`, {
    cache: "no-store",
    method: "GET",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const errorCode = readApiErrorCode(payload);

    if (errorCode) {
      throw createAppError(errorCode);
    }

    throw new Error(`Failed to fetch assignments for event: ${eventId}`);
  }

  const data = await response.json();

  return eventAssignmentsResponseSchema.parse(data).assignments;
}
