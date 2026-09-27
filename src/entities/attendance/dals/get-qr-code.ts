import type { Db } from "@/shared/api/database";

/**
 * 홀의 QR 값과 그 값이 선 시각이다. 둘이 한 행에서 같이 나오는 것은 화면이 둘을 같이 쓰기
 * 때문이다 — 그림은 코드로 굽고 그 아래 한 줄은 시각으로 짓는다
 * (`docs/2-design/modules/attendance/screens/qr.md`의 「QR 그림」).
 *
 * **빈 상태가 없다.** 첫 코드는 마이그레이션이 홀 행에 맞춰 심어서 `rotate_qr`을 한 번도
 * 안 부른 상태가 없다(`docs/2-design/modules/attendance/design.md`의 「QR」).
 * `null`이 오는 자리는 근무자가 읽었을 때다 — RLS가 행을 안 내준다.
 *
 * **캐시를 안 쥔다.** 관리자가 돌리면 옛 값이 그 자리에서 `invalid_qr`이 되니, 화면에 들어올
 * 때마다 새로 읽는다.
 */

export const QR_CODE_STALE_TIME_MS = 0;

export type HallQrCode = {
  qrCode: string;
  rotatedAt: string;
};

export function qrCodeKey(): string[] {
  return ["hall", "qr"];
}

export async function getQrCode(client: Db): Promise<HallQrCode | null> {
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
