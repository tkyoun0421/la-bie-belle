"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseDeleteEventTemplateInput,
  type DeleteEventTemplateInput,
} from "#/mutations/events/models/schemas/deleteEventTemplate";
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
  const { data, error } = await client
    .from("event_templates")
    .delete()
    .eq("id", values.id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error("행사 템플릿을 삭제하지 못했습니다.");
  }

  if (!data?.id) {
    throw new Error("삭제할 행사 템플릿을 찾지 못했습니다.");
  }

  return data.id;
}
