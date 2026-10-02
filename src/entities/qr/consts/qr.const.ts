/**
 * QR 도메인이 정한 값들이다.
 */

/**
 * 종이의 QR이 데려오는 자리다. **`src/app/check-in.tsx`의 파일 이름과 같은 글자여야
 * 한다** — Expo Router가 파일 이름을 그대로 경로로 읽으니 한쪽만 고치면 벽에 붙은 종이가
 * 없는 화면을 가리킨다(`docs/2-design/modules/attendance/design.md`의 「QR」).
 */
export const CHECK_IN_PATH = "/check-in";

/**
 * 지금 코드를 읽을 때 캐시를 쥐는 시간이다. 0인 것은 관리자가 돌리면 옛 값이 그 자리에서
 * `invalid_qr`이 되기 때문이다 — 화면에 들어올 때마다 새로 읽는다
 * (`docs/2-design/modules/attendance/design.md`의 「QR」).
 *
 * `queryClient`의 기본값도 0인데 여기 적어 두는 것은, 기본값이 바뀌어도 이 질의는 0이어야
 * 하기 때문이다. 읽는 쪽과 무효화하는 쪽이 한 값을 본다.
 */
export const QR_CODE_STALE_TIME_MS = 0;
