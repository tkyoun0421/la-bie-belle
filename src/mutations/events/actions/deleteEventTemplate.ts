"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getEventTemplateDeleteBlockReason } from "#/entities/events/models/policies/eventTemplatePolicy";
import {
  createEventTemplateError,
  eventTemplateErrorCodes,
} from "#/entities/events/models/errors/eventTemplateError";
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
    throw createEventTemplateError(
      eventTemplateErrorCodes.deleteTargetNotFound
    );
  }

  const templatesCount = await countRecords({ client });
  const deleteBlockReason = getEventTemplateDeleteBlockReason({
    isPrimary: targetTemplate.isPrimary,
    templatesCount,
  });

  if (deleteBlockReason === "primary") {
    throw createEventTemplateError(
      eventTemplateErrorCodes.deletePrimaryForbidden
    );
  }

  if (deleteBlockReason === "last-template") {
    throw createEventTemplateError(
      eventTemplateErrorCodes.deleteLastForbidden
    );
  }

  await deleteRecord(values.id, { client });

  return values.id;
}
