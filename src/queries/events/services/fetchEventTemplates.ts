import { eventTemplatesResponseSchema } from "#/entities/events/models/schemas/eventTemplate";
import {
  createAppError,
  readApiErrorCode,
} from "#/shared/lib/errors/appError";

export async function fetchEventTemplates() {
  const response = await fetch("/api/event-templates", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const errorCode = readApiErrorCode(payload);

    if (errorCode) {
      throw createAppError(errorCode);
    }

    throw new Error("Failed to fetch event templates.");
  }

  const data = await response.json();

  return eventTemplatesResponseSchema.parse(data).templates;
}
