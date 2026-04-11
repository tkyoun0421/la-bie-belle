import type { EventStatus } from "#/entities/events/models/schemas/event";

export function canWriteEventApplication(eventStatus: EventStatus) {
  return eventStatus === "draft" || eventStatus === "recruiting";
}
