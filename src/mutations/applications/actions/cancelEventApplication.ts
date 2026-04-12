"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applicationErrors,
  applicationErrorCodes,
} from "#/entities/applications/models/errors/applicationError";
import { cancelEventApplicationRecord } from "#/entities/applications/repositories/writeApplicationRepository";
import { canWriteEventApplication } from "#/entities/events/models/policies/eventApplicationPolicy";
import { readEventById } from "#/entities/events/repositories/readEventRepository";
import {
  parseCancelEventApplicationInput,
  type CancelEventApplicationInput,
} from "#/mutations/applications/schemas/cancelEventApplication";
import { requireAppActor } from "#/shared/lib/auth/appActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";
import type { Database } from "#/shared/types/database";

type CancelEventApplicationDependencies = {
  cancelRecord?: typeof cancelEventApplicationRecord;
  client?: SupabaseClient<Database>;
  readEvent?: typeof readEventById;
  requireActor?: typeof requireAppActor;
};

export async function cancelEventApplicationAction(
  input: CancelEventApplicationInput,
  dependencies: CancelEventApplicationDependencies = {}
) {
  const values = parseCancelEventApplicationInput(input);
  const requireActor = dependencies.requireActor ?? requireAppActor;
  const actor = await requireActor();
  const client = dependencies.client ?? createSupabaseAdminClient();
  const readEvent = dependencies.readEvent ?? readEventById;
  const cancelRecord =
    dependencies.cancelRecord ?? cancelEventApplicationRecord;
  const event = await readEvent(values.eventId, { client });

  if (!event) {
    throw applicationErrors.create(applicationErrorCodes.cancelEventNotFound);
  }

  if (!canWriteEventApplication(event.status)) {
    throw applicationErrors.create(applicationErrorCodes.cancelClosedEvent);
  }

  await cancelRecord(
    {
      eventId: values.eventId,
      userId: actor.userId,
    },
    { client }
  );

  return {
    eventId: values.eventId,
    status: "cancelled" as const,
  };
}
