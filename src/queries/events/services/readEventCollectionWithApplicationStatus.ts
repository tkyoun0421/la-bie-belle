import type { SupabaseClient } from "@supabase/supabase-js";
import { readApplicationStatusesByEventIds } from "#/entities/applications/repositories/readApplicationRepository";
import { readEvents } from "#/entities/events/repositories/readEventRepository";
import type { EventListItem } from "#/entities/events/models/schemas/event";
import type { Database } from "#/shared/types/database";

type ReadEventCollectionWithApplicationStatusOptions = {
  client: SupabaseClient<Database>;
  viewerId: string | null;
};

export async function readEventCollectionWithApplicationStatus({
  client,
  viewerId,
}: ReadEventCollectionWithApplicationStatusOptions): Promise<EventListItem[]> {
  const events = await readEvents({ client });

  if (!viewerId || events.length === 0) {
    return events.map((event) => ({
      ...event,
      viewerApplicationStatus: null,
    }));
  }

  const applicationStatuses = await readApplicationStatusesByEventIds(
    viewerId,
    events.map((event) => event.id),
    { client }
  );

  return events.map((event) => ({
    ...event,
    viewerApplicationStatus: applicationStatuses[event.id] ?? null,
  }));
}
