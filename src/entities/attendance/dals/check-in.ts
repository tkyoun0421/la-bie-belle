import type { SupabaseClient } from "@supabase/supabase-js";
import { DomainError, toApiError } from "@/shared/api/errors";

export type CheckInMethod = "location" | "qr";

export type CheckInParams = {
  dayId: string;
  reportedAt: string;
  method: CheckInMethod;
  lat?: number | null;
  lng?: number | null;
  qrCode?: string | null;
};

export type CheckInDeps = {
  client: SupabaseClient;
  wait?: (ms: number) => Promise<void>;
};

const RETRY_DELAYS_MS = [2000, 4000, 8000, 16000, 32000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function checkIn(
  params: CheckInParams,
  deps: CheckInDeps,
): Promise<void> {
  const wait = deps.wait ?? sleep;

  for (let attempt = 0; ; attempt += 1) {
    const { error } = await deps.client.rpc("check_in", {
      p_day_id: params.dayId,
      p_reported_at: params.reportedAt,
      p_method: params.method,
      p_lat: params.lat ?? null,
      p_lng: params.lng ?? null,
      p_qr_code: params.qrCode ?? null,
    });

    if (!error) {
      return;
    }

    const apiError = toApiError(error);
    if (apiError instanceof DomainError || attempt >= RETRY_DELAYS_MS.length) {
      throw apiError;
    }

    await wait(RETRY_DELAYS_MS[attempt]);
  }
}
