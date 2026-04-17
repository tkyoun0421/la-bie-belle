import { z } from "zod";
import { applicantSchema } from "#/entities/assignments/models/schemas/applicant";
import { createAppError, readApiErrorCode } from "#/shared/lib/errors/appError";

const eventApplicantsResponseSchema = z.object({
  applicants: z.array(applicantSchema),
});

export async function fetchEventApplicants(eventId: string) {
  const response = await fetch(`/api/events/${eventId}/applicants`, {
    cache: "no-store",
    method: "GET",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const errorCode = readApiErrorCode(payload);

    if (errorCode) {
      throw createAppError(errorCode);
    }

    throw new Error(`Failed to fetch applicants for event: ${eventId}`);
  }

  const data = await response.json();

  return eventApplicantsResponseSchema.parse(data).applicants;
}
