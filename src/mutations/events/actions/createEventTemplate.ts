"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import {
  readEventTemplateById,
} from "#/entities/events/repositories/readEventTemplateRepository";
import { createEventTemplateRecord } from "#/entities/events/repositories/writeEventTemplateRepository";
import {
  parseCreateEventTemplateInput,
  type CreateEventTemplateInput,
} from "#/mutations/events/schemas/createEventTemplate";
import { requireAdminActor } from "#/shared/lib/auth/adminActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";
import type { Database } from "#/shared/types/database";

type CreateEventTemplateDependencies = {
  client?: SupabaseClient<Database>;
  createRecord?: typeof createEventTemplateRecord;
  readById?: typeof readEventTemplateById;
  requireActor?: typeof requireAdminActor;
};

export async function createEventTemplateAction(
  input: CreateEventTemplateInput,
  dependencies: CreateEventTemplateDependencies = {}
): Promise<EventTemplate> {
  const values = parseCreateEventTemplateInput(input);
  const requireActor = dependencies.requireActor ?? requireAdminActor;
  await requireActor();
  const client = dependencies.client ?? createSupabaseAdminClient();
  const createRecord = dependencies.createRecord ?? createEventTemplateRecord;
  const readById = dependencies.readById ?? readEventTemplateById;
  const templateId = await createRecord(
    {
      createdBy: null,
      firstServiceAt: values.firstServiceAt,
      isPrimary: values.isPrimary,
      lastServiceEndAt: values.lastServiceEndAt,
      name: values.name,
      slotDefaults: values.slotDefaults,
    },
    { client }
  );

  return readById(templateId, { client });
}
