import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applicationErrors,
  applicationErrorCodes,
} from "#/entities/applications/models/errors/applicationError";
import type { Database } from "#/shared/types/database";

type ApplicationRepositoryOptions = {
  client: SupabaseClient<Database>;
};

export type WriteApplicationRecordInput = {
  eventId: string;
  userId: string;
};

export async function applyToEventRecord(
  input: WriteApplicationRecordInput,
  options: ApplicationRepositoryOptions
) {
  const { client } = options;
  const { error } = await client.from("applications").upsert(
    {
      applied_at: new Date().toISOString(),
      event_id: input.eventId,
      status: "applied",
      user_id: input.userId,
    },
    {
      onConflict: "event_id,user_id",
    }
  );

  if (error) {
    throw applicationErrors.create(applicationErrorCodes.applyFailed, {
      cause: error,
    });
  }
}

export async function cancelEventApplicationRecord(
  input: WriteApplicationRecordInput,
  options: ApplicationRepositoryOptions
) {
  const { client } = options;
  const { data, error } = await client
    .from("applications")
    .update({
      status: "cancelled",
    })
    .eq("event_id", input.eventId)
    .eq("user_id", input.userId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw applicationErrors.create(applicationErrorCodes.cancelFailed, {
      cause: error,
    });
  }

  if (!data) {
    throw applicationErrors.create(applicationErrorCodes.cancelTargetMissing);
  }
}
