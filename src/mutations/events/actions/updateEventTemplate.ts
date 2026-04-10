"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  eventTemplateErrors,
  eventTemplateErrorCodes,
} from "#/entities/events/models/errors/eventTemplateError";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import {
  readEventTemplateById,
} from "#/entities/events/repositories/readEventTemplateRepository";
import { updateEventTemplateRecord } from "#/entities/events/repositories/writeEventTemplateRepository";
import {
  parseUpdateEventTemplateInput,
  type UpdateEventTemplateInput,
} from "#/mutations/events/schemas/updateEventTemplate";
import { requireAdminActor } from "#/shared/lib/auth/adminActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";
import type { Database } from "#/shared/types/database";

type UpdateEventTemplateDependencies = {
  client?: SupabaseClient<Database>;
  readById?: typeof readEventTemplateById;
  requireActor?: typeof requireAdminActor;
  updateRecord?: typeof updateEventTemplateRecord;
};

export async function updateEventTemplateAction(
  input: UpdateEventTemplateInput,
  dependencies: UpdateEventTemplateDependencies = {}
): Promise<EventTemplate> {
  const values = parseUpdateEventTemplateInput(input);
  const requireActor = dependencies.requireActor ?? requireAdminActor;
  await requireActor();
  const client = dependencies.client ?? createSupabaseAdminClient();
  const readById = dependencies.readById ?? readEventTemplateById;
  const updateRecord = dependencies.updateRecord ?? updateEventTemplateRecord;
  const templateId = await updateRecord(
    {
      firstServiceAt: values.firstServiceAt,
      id: values.id,
      isPrimary: values.isPrimary,
      lastServiceEndAt: values.lastServiceEndAt,
      name: values.name,
      slotDefaults: values.slotDefaults,
    },
    { client }
  );

  const template = await readById(templateId, { client });

  if (!template) {
    throw eventTemplateErrors.create(
      eventTemplateErrorCodes.updateResultMissing
    );
  }

  return template;
}
