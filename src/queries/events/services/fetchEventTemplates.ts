import { eventTemplatesResponseSchema } from "#/entities/events/models/schemas/eventTemplate";

export async function fetchEventTemplates() {
  const response = await fetch("/api/event-templates", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch event templates.");
  }

  const data = await response.json();

  return eventTemplatesResponseSchema.parse(data).templates;
}
