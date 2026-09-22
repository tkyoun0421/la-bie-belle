import type { SupabaseClient } from "@supabase/supabase-js";
import { toApiError } from "@/shared/api/errors";

export async function rotateQr(client: SupabaseClient): Promise<void> {
  const { error } = await client.rpc("rotate_qr");

  if (error) {
    throw toApiError(error);
  }
}
