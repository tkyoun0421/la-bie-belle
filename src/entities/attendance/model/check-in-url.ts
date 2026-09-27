/**
 * 종이의 QR이 담는 주소다. 정본은
 * `docs/2-design/modules/attendance/design.md`의 「QR」다 — 코드 문자열을 그대로 굽지 않고
 * `/check-in?c=<코드>`를 굽는 이유가 거기 있다. 기기 카메라 앱이 읽으면 링크가 되고, 그
 * 링크가 앱을 출근 인증 자리로 데려온다.
 *
 * **끝의 슬래시를 접는다.** `EXPO_PUBLIC_APP_URL`은 사람이 채우는 값이라 `https://a.example`로
 * 올 수도 `https://a.example/`로 올 수도 있고, 접지 않으면 주소에 `//`가 생겨 도메인 증명
 * 파일이 그 경로를 안 받는다.
 */

const CHECK_IN_PATH = "/check-in";

export function buildCheckInUrl(appUrl: string, code: string): string {
  const origin = appUrl.replace(/\/+$/, "");

  return `${origin}${CHECK_IN_PATH}?c=${encodeURIComponent(code)}`;
}
