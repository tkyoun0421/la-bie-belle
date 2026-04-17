"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  eventErrors,
  eventErrorCodes,
} from "#/entities/events/models/errors/eventError";
import { readEventsByDates } from "#/entities/events/repositories/readEventRepository";
import { createEventRecord } from "#/entities/events/repositories/writeEventRepository";
import {
  parseCreateBulkEventsInput,
  type CreateBulkEventsInput,
} from "#/mutations/events/schemas/createBulkEvents";
import { requireAdminActor } from "#/shared/lib/auth/adminActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";
import type { Database } from "#/shared/types/database";

type CreateBulkEventsDependencies = {
  client?: SupabaseClient<Database>;
  createRecord?: typeof createEventRecord;
  readByDates?: typeof readEventsByDates;
  requireActor?: typeof requireAdminActor;
};

export async function createBulkEventsAction(
  input: CreateBulkEventsInput,
  dependencies: CreateBulkEventsDependencies = {}
): Promise<{ eventIds: string[] }> {
  const values = parseCreateBulkEventsInput(input);
  const requireActor = dependencies.requireActor ?? requireAdminActor;
  const actor = await requireActor();
  const client = dependencies.client ?? createSupabaseAdminClient();
  const createRecord = dependencies.createRecord ?? createEventRecord;
  const readByDates = dependencies.readByDates ?? readEventsByDates;

  const existingEvents = await readByDates(values.eventDates, { client });
  if (existingEvents.length > 0) {
    throw eventErrors.create(eventErrorCodes.createDuplicateDate);
  }

  const eventIds: string[] = [];
  for (const eventDate of values.eventDates) {
    const eventId = await createRecord(
      {
        createdBy: actor.userId,
        eventDate,
        templateId: values.templateId,
        title: values.title,
      },
      { client }
    );
    eventIds.push(eventId);
  }

  return { eventIds };
}
