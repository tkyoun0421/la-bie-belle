"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  eventErrors,
  eventErrorCodes,
} from "#/entities/events/models/errors/eventError";
import type { EventDetail } from "#/entities/events/models/schemas/event";
import { readEventById } from "#/entities/events/repositories/readEventRepository";
import { createEventRecord } from "#/entities/events/repositories/writeEventRepository";
import {
  parseCreateEventInput,
  type CreateEventInput,
} from "#/mutations/events/schemas/createEvent";
import { requireAdminActor } from "#/shared/lib/auth/adminActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";
import type { Database } from "#/shared/types/database";

type CreateEventDependencies = {
  client?: SupabaseClient<Database>;
  createRecord?: typeof createEventRecord;
  readById?: typeof readEventById;
  requireActor?: typeof requireAdminActor;
};

export async function createEventAction(
  input: CreateEventInput,
  dependencies: CreateEventDependencies = {}
): Promise<EventDetail> {
  const values = parseCreateEventInput(input);
  const requireActor = dependencies.requireActor ?? requireAdminActor;
  const actor = await requireActor();
  const client = dependencies.client ?? createSupabaseAdminClient();
  const createRecord = dependencies.createRecord ?? createEventRecord;
  const readById = dependencies.readById ?? readEventById;
  const eventId = await createRecord(
    {
      createdBy: actor.userId,
      eventDate: values.eventDate,
      templateId: values.templateId,
      title: values.title,
    },
    { client }
  );
  const event = await readById(eventId, { client });

  if (!event) {
    throw eventErrors.create(eventErrorCodes.createResultMissing);
  }

  return event;
}
