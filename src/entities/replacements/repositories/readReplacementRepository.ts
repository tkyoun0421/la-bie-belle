import type { SupabaseClient } from "@supabase/supabase-js";
import { createAppError } from "#/shared/lib/errors/appError";
import type { Database } from "#/shared/types/database";
import { 
  replacementListItemSchema, 
  replacementRequestSchema,
  type ReplacementListItem,
  type ReplacementRequest
} from "#/entities/replacements/models/schemas/replacementRequest";

type ReplacementRepositoryOptions = {
  client: SupabaseClient<Database>;
};

export async function readOpenReplacementRequests(
  options: ReplacementRepositoryOptions
): Promise<ReplacementListItem[]> {
  const { client } = options;
  const { data, error } = await client
    .from("replacement_requests")
    .select(
      `
      id,
      position_id,
      status,
      created_at,
      positions (
        id,
        name
      ),
      assignments!replacement_requests_cancelled_assignment_id_fkey (
        id,
        event_id,
        events (
          id,
          title,
          event_date,
          time_label
        )
      )
    `
    )
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    throw createAppError("REPLACEMENT_LIST_FAILED", {
      cause: error,
    });
  }

  return (data ?? []).map((row) => {
    const position = row.positions as { id: string; name: string } | null;
    const assignment = row.assignments as unknown as { 
      event_id: string; 
      events: { id: string; title: string; event_date: string; time_label: string } | null 
    } | null;
    const event = assignment?.events;

    return replacementListItemSchema.parse({
      id: row.id,
      positionId: row.position_id,
      positionName: position?.name ?? "",
      status: row.status,
      createdAt: row.created_at,
      eventId: assignment?.event_id ?? "",
      eventTitle: event?.title ?? "",
      eventDate: event?.event_date ?? "",
      timeLabel: event?.time_label ?? "",
    });
  });
}

export async function readReplacementRequestById(
  requestId: string,
  options: ReplacementRepositoryOptions
): Promise<(ReplacementRequest & { cancelledUserId: string }) | null> {
  const { client } = options;
  const { data, error } = await client
    .from("replacement_requests")
    .select(
      `
      *,
      assignments!replacement_requests_cancelled_assignment_id_fkey (
        user_id
      )
    `
    )
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    throw createAppError("REPLACEMENT_READ_FAILED", {
      cause: error,
    });
  }

  if (!data) {
    return null;
  }

  const assignment = data.assignments as unknown as { user_id: string } | null;

  return {
    ...replacementRequestSchema.parse(data),
    cancelledUserId: assignment?.user_id ?? "",
  };
}

export async function readReplacementApplications(
  requestId: string,
  options: ReplacementRepositoryOptions
) {
  const { client } = options;
  const { data, error } = await client
    .from("replacement_applications")
    .select(
      `
      id,
      user_id,
      applied_at,
      users (
        id,
        name,
        email
      )
    `
    )
    .eq("replacement_request_id", requestId)
    .order("applied_at", { ascending: true });

  if (error) {
    throw createAppError("REPLACEMENT_APPLICATION_LIST_FAILED", {
      cause: error,
    });
  }

  return (data ?? []).map((row) => {
    const user = row.users as { id: string; name: string; email: string } | null;

    return {
      id: row.id,
      userId: row.user_id,
      userName: user?.name ?? "",
      userEmail: user?.email ?? "",
      appliedAt: row.applied_at,
    };
  });
}
