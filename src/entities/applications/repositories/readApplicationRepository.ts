import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applicationErrors,
  applicationErrorCodes,
} from "#/entities/applications/models/errors/applicationError";
import {
  eventApplicationStatusRecordSchema,
  type ApplicationStatus,
} from "#/entities/applications/models/schemas/application";
import type { Database, TableRow } from "#/shared/types/database";

type ApplicationRepositoryOptions = {
  client: SupabaseClient<Database>;
};

type ApplicationStatusRow = Pick<TableRow<"applications">, "event_id" | "status">;

export async function readApplicationStatusesByEventIds(
  userId: string,
  eventIds: string[],
  options: ApplicationRepositoryOptions
): Promise<Record<string, ApplicationStatus>> {
  if (eventIds.length === 0) {
    return {};
  }

  const { client } = options;
  const { data, error } = await client
    .from("applications")
    .select("event_id, status")
    .eq("user_id", userId)
    .in("event_id", eventIds);

  if (error) {
    throw applicationErrors.create(applicationErrorCodes.listFailed, {
      cause: error,
    });
  }

  return (data ?? []).reduce<Record<string, ApplicationStatus>>((acc, row) => {
    const record = eventApplicationStatusRecordSchema.parse({
      eventId: (row as ApplicationStatusRow).event_id,
      status: (row as ApplicationStatusRow).status,
    });

    acc[record.eventId] = record.status;
    return acc;
  }, {});
}

export async function readApplicationStatusByEventId(
  userId: string,
  eventId: string,
  options: ApplicationRepositoryOptions
): Promise<ApplicationStatus | null> {
  const statuses = await readApplicationStatusesByEventIds(userId, [eventId], options);

  return statuses[eventId] ?? null;
}
