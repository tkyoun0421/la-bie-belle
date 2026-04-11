import type { SupabaseClient } from "@supabase/supabase-js";
import { readApplicationStatusByEventId } from "#/entities/applications/repositories/readApplicationRepository";
import { readEventById } from "#/entities/events/repositories/readEventRepository";
import type { EventDetail } from "#/entities/events/models/schemas/event";
import type { Database } from "#/shared/types/database";

type ReadEventDetailWithApplicationStatusOptions = {
  client: SupabaseClient<Database>;
  eventId: string;
  viewerId: string | null;
};

export async function readEventDetailWithApplicationStatus({
  client,
  eventId,
  viewerId,
}: ReadEventDetailWithApplicationStatusOptions): Promise<EventDetail | null> {
  const event = await readEventById(eventId, { client });

  if (!event) {
    return null;
  }

  if (!viewerId) {
    return {
      ...event,
      viewerApplicationStatus: null,
    };
  }

  const applicationStatus = await readApplicationStatusByEventId(
    viewerId,
    eventId,
    { client }
  );

  return {
    ...event,
    viewerApplicationStatus: applicationStatus,
  };
}
