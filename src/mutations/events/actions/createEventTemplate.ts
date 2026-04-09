"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import { readEventTemplateById } from "#/entities/events/repositories/eventTemplateRepository";
import {
  parseCreateEventTemplateInput,
  type CreateEventTemplateInput,
} from "#/mutations/events/models/schemas/createEventTemplate";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

type CreateEventTemplateDependencies = {
  client?: SupabaseClient;
  readById?: typeof readEventTemplateById;
};

export async function createEventTemplateAction(
  input: CreateEventTemplateInput,
  dependencies: CreateEventTemplateDependencies = {}
): Promise<EventTemplate> {
  const values = parseCreateEventTemplateInput(input);
  const client = dependencies.client ?? createSupabaseAdminClient();
  const readById = dependencies.readById ?? readEventTemplateById;

  const { data: templateId, error } = await client.rpc(
    "create_event_template",
    {
      p_name: values.name,
      p_first_service_at: values.firstServiceAt,
      p_last_service_end_at: values.lastServiceEndAt,
      p_slot_defaults: values.slotDefaults.map((slot) => ({
        position_id: slot.positionId,
        required_count: slot.requiredCount,
        training_count: slot.trainingCount,
      })),
      p_created_by: null,
    }
  );

  if (error) {
    throw new Error("행사 템플릿을 저장하지 못했습니다.");
  }

  if (!templateId || typeof templateId !== "string") {
    throw new Error("생성된 행사 템플릿 식별자를 확인하지 못했습니다.");
  }

  return readById(templateId, { client });
}
