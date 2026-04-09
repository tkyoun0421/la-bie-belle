import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mapEventTemplateRow,
  type EventTemplateRow,
} from "#/queries/events/models/mappers/mapEventTemplateRow";
import {
  eventTemplatesResponseSchema,
  type EventTemplate,
} from "#/queries/events/models/schemas/eventTemplate";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

const eventTemplateSelect = `
  id,
  name,
  time_label,
  first_service_at,
  last_service_end_at,
  created_at,
  event_template_position_slots (
    position_id,
    required_count,
    training_count,
    positions (
      id,
      name
    )
  )
`;

type EventTemplateRepositoryOptions = {
  client?: SupabaseClient;
};

export async function readEventTemplates(
  options: EventTemplateRepositoryOptions = {}
): Promise<EventTemplate[]> {
  const client = options.client ?? createSupabaseAdminClient();
  const { data, error } = await client
    .from("event_templates")
    .select(eventTemplateSelect)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("행사 템플릿 목록을 불러오지 못했습니다.");
  }

  const templates = (data ?? []).map((row) =>
    mapEventTemplateRow(row as EventTemplateRow)
  );

  return eventTemplatesResponseSchema.parse({ templates }).templates;
}

export async function readEventTemplateById(
  templateId: string,
  options: EventTemplateRepositoryOptions = {}
): Promise<EventTemplate> {
  const client = options.client ?? createSupabaseAdminClient();
  const { data, error } = await client
    .from("event_templates")
    .select(eventTemplateSelect)
    .eq("id", templateId)
    .single();

  if (error) {
    throw new Error("행사 템플릿을 다시 불러오지 못했습니다.");
  }

  return mapEventTemplateRow(data as EventTemplateRow);
}
