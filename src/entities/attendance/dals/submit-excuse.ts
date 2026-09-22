import type { SupabaseClient } from "@supabase/supabase-js";
import { toApiError } from "@/shared/api/errors";

export type SubmitExcuseParams = {
  dayId: string;
  body: string;
};

export async function submitExcuse(
  client: SupabaseClient,
  params: SubmitExcuseParams,
): Promise<void> {
  const { error } = await client.rpc("submit_excuse", {
    p_day_id: params.dayId,
    p_body: params.body,
  });

  if (error) {
    throw toApiError(error);
  }
}
