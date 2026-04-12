import type { SupabaseClient } from "@supabase/supabase-js";
import { eventErrors, eventErrorCodes } from "#/entities/events/models/errors/eventError";
import type { Database } from "#/shared/types/database";

type EventRepositoryOptions = {
  client: SupabaseClient<Database>;
};

export type CreateEventRecordInput = {
  createdBy: string | null;
  eventDate: string;
  templateId: string;
  title: string;
};

export async function createEventRecord(
  input: CreateEventRecordInput,
  options: EventRepositoryOptions
) {
  const { client } = options;
  const { data, error } = await client.rpc("create_event", {
    p_created_by: input.createdBy ?? undefined,
    p_event_date: input.eventDate,
    p_template_id: input.templateId,
    p_title: input.title,
  });

  if (error) {
    if ("code" in error && error.code === "P0002") {
      throw eventErrors.create(eventErrorCodes.createTemplateNotFound, {
        cause: error,
      });
    }

    throw eventErrors.create(eventErrorCodes.createFailed, {
      cause: error,
    });
  }

  if (!data || typeof data !== "string") {
    throw eventErrors.create(eventErrorCodes.createResultMissing);
  }

  return data;
}
