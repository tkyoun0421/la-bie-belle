"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applicationErrors,
  applicationErrorCodes,
} from "#/entities/applications/models/errors/applicationError";
import { applyToEventRecord } from "#/entities/applications/repositories/writeApplicationRepository";
import { canWriteEventApplication } from "#/entities/events/models/policies/eventApplicationPolicy";
import { readEventById } from "#/entities/events/repositories/readEventRepository";
import { parseApplyToEventInput, type ApplyToEventInput } from "#/mutations/applications/schemas/applyToEvent";
import { requireAppActor } from "#/shared/lib/auth/appActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";
import type { Database } from "#/shared/types/database";

type ApplyToEventDependencies = {
  applyRecord?: typeof applyToEventRecord;
  client?: SupabaseClient<Database>;
  readEvent?: typeof readEventById;
  requireActor?: typeof requireAppActor;
};

export async function applyToEventAction(
  input: ApplyToEventInput,
  dependencies: ApplyToEventDependencies = {}
) {
  const values = parseApplyToEventInput(input);
  const requireActor = dependencies.requireActor ?? requireAppActor;
  const actor = await requireActor();
  const client = dependencies.client ?? createSupabaseAdminClient();
  const readEvent = dependencies.readEvent ?? readEventById;
  const applyRecord = dependencies.applyRecord ?? applyToEventRecord;
  const event = await readEvent(values.eventId, { client });

  if (!event) {
    throw applicationErrors.create(applicationErrorCodes.applyEventNotFound);
  }

  if (!canWriteEventApplication(event.status)) {
    throw applicationErrors.create(applicationErrorCodes.applyClosedEvent);
  }

  await applyRecord(
    {
      eventId: values.eventId,
      userId: actor.userId,
    },
    { client }
  );

  return {
    eventId: values.eventId,
    status: "applied" as const,
  };
}
