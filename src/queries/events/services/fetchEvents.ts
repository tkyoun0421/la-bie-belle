import { eventListResponseSchema } from "#/entities/events/models/schemas/event";
import { createAppError, readApiErrorCode } from "#/shared/lib/errors/appError";

export async function fetchEvents() {
  const response = await fetch("/api/events", {
    cache: "no-store",
    method: "GET",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const errorCode = readApiErrorCode(payload);

    if (errorCode) {
      throw createAppError(errorCode);
    }

    throw new Error("Failed to fetch events.");
  }

  const data = await response.json();

  return eventListResponseSchema.parse(data).events;
}
