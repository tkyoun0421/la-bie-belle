import type { SupabaseClient } from "@supabase/supabase-js";
import {
  eventTemplateErrors,
  eventTemplateErrorCodes,
} from "#/entities/events/models/errors/eventTemplateError";
import { mapEventTemplateRow } from "#/entities/events/models/mappers/mapEventTemplateRow";
import {
  eventTemplatesResponseSchema,
  type EventTemplate,
} from "#/entities/events/models/schemas/eventTemplate";
import type { Database } from "#/shared/types/database";

const eventTemplateSelect = `
  id,
  name,
  is_primary,
  time_label,
  first_service_at,
  last_service_end_at,
  created_at,
  event_template_position_slots (
    position_id,
    required_count_override,
    training_count,
    positions (
      id,
      name,
      default_required_count
    )
  )
`;

type EventTemplateRepositoryOptions = {
  client: SupabaseClient<Database>;
};

export async function readEventTemplates(
  options: EventTemplateRepositoryOptions
): Promise<EventTemplate[]> {
  const { client } = options;
  const { data, error } = await client
    .from("event_templates")
    .select(eventTemplateSelect)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw eventTemplateErrors.create(eventTemplateErrorCodes.listFailed, {
      cause: error,
    });
  }

  const templates = (data ?? []).map((row) => mapEventTemplateRow(row));

  return eventTemplatesResponseSchema.parse({ templates }).templates;
}

export async function readEventTemplateById(
  templateId: string,
  options: EventTemplateRepositoryOptions
): Promise<EventTemplate | null> {
  const { client } = options;
  const { data, error } = await client
    .from("event_templates")
    .select(eventTemplateSelect)
    .eq("id", templateId)
    .maybeSingle();

  if (error) {
    throw eventTemplateErrors.create(eventTemplateErrorCodes.readFailed, {
      cause: error,
    });
  }

  if (!data) {
    return null;
  }

  return mapEventTemplateRow(data);
}
