import type { SupabaseClient } from "@supabase/supabase-js";
import { toApiError } from "@/shared/api/errors";

export type DecideExcuseParams = {
  excuseId: string;
  approved: boolean;
  reason: string | null;
};

export async function decideExcuse(
  client: SupabaseClient,
  params: DecideExcuseParams,
): Promise<void> {
  const { error } = await client.rpc("decide_excuse", {
    p_excuse_id: params.excuseId,
    p_approved: params.approved,
    p_reason: params.reason,
  });

  if (error) {
    throw toApiError(error);
  }
}
