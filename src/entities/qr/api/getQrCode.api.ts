import type { DB } from "@/shared/api/database";
import type { HallQrCode } from "@/entities/qr/model/qr.type";

/**
 * 홀의 QR 값과 그 값이 선 시각을 한 행에서 같이 읽어 `HallQrCode`로 낸다.
 *
 * **빈 상태가 없다.** 첫 코드는 마이그레이션이 홀 행에 맞춰 심어서 `rotate_qr`을 한 번도
 * 안 부른 상태가 없다(`docs/2-design/modules/attendance/design.md`의 「QR」).
 * `null`이 오는 자리는 근무자가 읽었을 때다 — RLS가 행을 안 내준다.
 *
 * **캐시를 안 쥔다.** 그 까닭과 값은 `consts/qr.const.ts`의 `QR_CODE_STALE_TIME_MS`가 든다.
 */

export async function getQrCode(client: DB): Promise<HallQrCode | null> {
  const { data, error } = await client
    .from("hall_secrets")
    .select("qr_code, rotated_at")
    .limit(1)
    .maybeSingle<{ qr_code: string; rotated_at: string }>();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return { qrCode: data.qr_code, rotatedAt: data.rotated_at };
}
