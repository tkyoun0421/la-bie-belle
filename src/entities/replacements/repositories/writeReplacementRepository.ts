import type { SupabaseClient } from "@supabase/supabase-js";
import { createAppError } from "#/shared/lib/errors/appError";
import type { Database } from "#/shared/types/database";

type ReplacementRepositoryOptions = {
  client: SupabaseClient<Database>;
};

export type CreateReplacementRequestInput = {
  cancelledAssignmentId: string;
  positionId: string;
};

export async function createReplacementRequest(
  input: CreateReplacementRequestInput,
  options: ReplacementRepositoryOptions
): Promise<string> {
  const { client } = options;
  const { data, error } = await client
    .from("replacement_requests")
    .insert({
      cancelled_assignment_id: input.cancelledAssignmentId,
      position_id: input.positionId,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    throw createAppError("REPLACEMENT_REQUEST_CREATE_FAILED", {
      cause: error,
    });
  }

  return data.id;
}

export async function createReplacementApplication(
  input: { replacementRequestId: string; userId: string },
  options: ReplacementRepositoryOptions
): Promise<string> {
  const { client } = options;
  const { data, error } = await client
    .from("replacement_applications")
    .insert({
      replacement_request_id: input.replacementRequestId,
      user_id: input.userId,
    })
    .select("id")
    .single();

  if (error) {
    throw createAppError("REPLACEMENT_APPLY_FAILED", {
      cause: error,
    });
  }

  return data.id;
}

export async function updateReplacementRequestStatus(
  requestId: string,
  status: Database["public"]["Enums"]["replacement_request_status"],
  options: {
    client: SupabaseClient<Database>;
    approvedAssignmentId?: string;
    closedBy?: string;
  }
): Promise<void> {
  const { client, approvedAssignmentId, closedBy } = options;
  const updatePayload: Database["public"]["Tables"]["replacement_requests"]["Update"] = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "approved" || status === "closed") {
    updatePayload.closed_at = new Date().toISOString();
    updatePayload.closed_by = closedBy;
    updatePayload.approved_assignment_id = approvedAssignmentId;
  }

  const { error } = await client
    .from("replacement_requests")
    .update(updatePayload)
    .eq("id", requestId);

  if (error) {
    throw createAppError("REPLACEMENT_STATUS_UPDATE_FAILED", {
      cause: error,
    });
  }
}
