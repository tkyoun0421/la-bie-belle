"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getEventTemplateDeleteBlockReason } from "#/entities/events/models/policies/eventTemplatePolicy";
import {
  countEventTemplateRecords,
  deleteEventTemplateRecord,
  readEventTemplateDeleteSnapshot,
} from "#/entities/events/repositories/writeEventTemplateRepository";
import {
  parseDeleteEventTemplateInput,
  type DeleteEventTemplateInput,
} from "#/mutations/events/schemas/deleteEventTemplate";
import { requireAdminActor } from "#/shared/lib/auth/adminActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

type DeleteEventTemplateDependencies = {
  client?: SupabaseClient;
  countRecords?: typeof countEventTemplateRecords;
  deleteRecord?: typeof deleteEventTemplateRecord;
  requireActor?: typeof requireAdminActor;
  readDeleteSnapshot?: typeof readEventTemplateDeleteSnapshot;
};

export async function deleteEventTemplateAction(
  input: DeleteEventTemplateInput,
  dependencies: DeleteEventTemplateDependencies = {}
) {
  const values = parseDeleteEventTemplateInput(input);
  const requireActor = dependencies.requireActor ?? requireAdminActor;
  await requireActor();
  const client = dependencies.client ?? createSupabaseAdminClient();
  const countRecords =
    dependencies.countRecords ?? countEventTemplateRecords;
  const deleteRecord = dependencies.deleteRecord ?? deleteEventTemplateRecord;
  const readDeleteSnapshot =
    dependencies.readDeleteSnapshot ?? readEventTemplateDeleteSnapshot;
  const targetTemplate = await readDeleteSnapshot(values.id, { client });

  if (!targetTemplate?.id) {
    throw new Error("삭제할 행사 템플릿을 찾지 못했습니다.");
  }

  const templatesCount = await countRecords({ client });
  const deleteBlockReason = getEventTemplateDeleteBlockReason({
    isPrimary: targetTemplate.isPrimary,
    templatesCount,
  });

  if (deleteBlockReason === "primary") {
    throw new Error("대표 템플릿은 삭제할 수 없습니다.");
  }

  if (deleteBlockReason === "last-template") {
    throw new Error("마지막 템플릿은 삭제할 수 없습니다.");
  }

  await deleteRecord(values.id, { client });

  return values.id;
}
