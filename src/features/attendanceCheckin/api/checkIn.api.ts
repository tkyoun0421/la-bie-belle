import { toApiError } from "@/shared/api/errors";
import { DomainError } from "@/shared/model/errors";
import type { CheckInDeps } from "@/features/attendanceCheckin/api/attendanceCheckin.dto";
import type { CheckInParams } from "@/features/attendanceCheckin/model/attendanceCheckin.type";

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
      p_lat: params.lat ?? undefined,
      p_lng: params.lng ?? undefined,
      p_qr_code: params.qrCode ?? undefined,
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
