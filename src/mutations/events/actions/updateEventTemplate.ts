"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import { readEventTemplateById } from "#/entities/events/repositories/eventTemplateRepository";
import {
  parseUpdateEventTemplateInput,
  type UpdateEventTemplateInput,
} from "#/mutations/events/schemas/updateEventTemplate";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

type UpdateEventTemplateDependencies = {
  client?: SupabaseClient;
  readById?: typeof readEventTemplateById;
};

export async function updateEventTemplateAction(
  input: UpdateEventTemplateInput,
  dependencies: UpdateEventTemplateDependencies = {}
): Promise<EventTemplate> {
  const values = parseUpdateEventTemplateInput(input);
  const client = dependencies.client ?? createSupabaseAdminClient();
  const readById = dependencies.readById ?? readEventTemplateById;
  const { data: templateId, error } = await client.rpc(
    "update_event_template",
    {
      p_template_id: values.id,
      p_name: values.name,
      p_is_primary: values.isPrimary,
      p_first_service_at: values.firstServiceAt,
      p_last_service_end_at: values.lastServiceEndAt,
      p_slot_defaults: values.slotDefaults.map((slot) => ({
        position_id: slot.positionId,
        required_count: slot.requiredCount,
        training_count: slot.trainingCount,
      })),
    }
  );

  if (error) {
    if ("code" in error && error.code === "P0002") {
      throw new Error("수정할 행사 템플릿을 찾지 못했습니다.");
    }

    throw new Error("행사 템플릿을 수정하지 못했습니다.");
  }

  if (!templateId || typeof templateId !== "string") {
    throw new Error("수정한 행사 템플릿 식별자를 확인하지 못했습니다.");
  }

  return readById(templateId, { client });
}
