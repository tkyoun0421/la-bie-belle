import type { SupabaseClient } from "@supabase/supabase-js";
import { eventErrors, eventErrorCodes } from "#/entities/events/models/errors/eventError";
import type { EventDetail } from "#/entities/events/models/schemas/event";
import {
  mapEventDetailRow,
} from "#/entities/events/models/mappers/mapEventRow";
import type { Database } from "#/shared/types/database";

const eventDetailSelect = `
  id,
  template_id,
  title,
  time_label,
  event_date,
  first_service_at,
  last_service_end_at,
  status,
  created_at,
  event_position_slots (
    position_id,
    required_count,
    training_count,
    positions (
      id,
      name,
      sort_order
    )
  )
`;

type EventRepositoryOptions = {
  client: SupabaseClient<Database>;
};

export async function readEventById(
  eventId: string,
  options: EventRepositoryOptions
): Promise<EventDetail | null> {
  const { client } = options;
  const { data, error } = await client
    .from("events")
    .select(eventDetailSelect)
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    throw eventErrors.create(eventErrorCodes.readFailed, {
      cause: error,
    });
  }

  if (!data) {
    return null;
  }

  return mapEventDetailRow(data);
}
