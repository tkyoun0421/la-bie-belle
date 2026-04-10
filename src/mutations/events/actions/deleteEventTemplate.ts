"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getEventTemplateDeleteBlockReason } from "#/entities/events/models/policies/eventTemplatePolicy";
import {
  parseDeleteEventTemplateInput,
  type DeleteEventTemplateInput,
} from "#/mutations/events/schemas/deleteEventTemplate";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

type DeleteEventTemplateDependencies = {
  client?: SupabaseClient;
};

export async function deleteEventTemplateAction(
  input: DeleteEventTemplateInput,
  dependencies: DeleteEventTemplateDependencies = {}
) {
  const values = parseDeleteEventTemplateInput(input);
  const client = dependencies.client ?? createSupabaseAdminClient();
  const { data: targetTemplate, error: targetError } = await client
    .from("event_templates")
    .select("id, is_primary")
    .eq("id", values.id)
    .maybeSingle();

  if (targetError) {
    throw new Error("삭제할 행사 템플릿을 찾지 못했습니다.");
  }

  if (!targetTemplate?.id) {
    throw new Error("삭제할 행사 템플릿을 찾지 못했습니다.");
  }

  const { count, error: countError } = await client
    .from("event_templates")
    .select("id", { count: "exact", head: true });

  if (countError) {
    throw new Error("행사 템플릿 개수를 확인하지 못했습니다.");
  }

  const deleteBlockReason = getEventTemplateDeleteBlockReason({
    isPrimary: targetTemplate.is_primary,
    templatesCount: count ?? 0,
  });

  if (deleteBlockReason === "primary") {
    throw new Error("대표 템플릿은 삭제할 수 없습니다.");
  }

  if (deleteBlockReason === "last-template") {
    throw new Error("마지막 템플릿은 삭제할 수 없습니다.");
  }

  const { error } = await client
    .from("event_templates")
    .delete()
    .eq("id", values.id);

  if (error) {
    throw new Error("행사 템플릿을 삭제하지 못했습니다.");
  }

  return values.id;
}
