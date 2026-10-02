/**
 * 홀의 QR 값과 그 값이 선 시각이다. 둘이 한 꼴에 든 것은 화면이 둘을 같이 쓰기 때문이다 —
 * 그림은 코드로 굽고 그 아래 한 줄은 시각으로 짓는다
 * (`docs/2-design/modules/attendance/screens/qr.md`의 「QR 그림」).
 *
 * **DB 열 이름이 아니다.** `hall_secrets`의 `qr_code`·`rotated_at`을 `getQrCode`가 이 꼴로
 * 옮겨 낸다 — 이 묶음에 `.dto.ts`가 없는 것이 그래서다.
 */
export type HallQrCode = {
  qrCode: string;
  rotatedAt: string;
};
