/**
 * 조각 목록(`/_catalog`)이 설 수 있는 빌드인지 본다.
 *
 * Expo Router는 파일이 있으면 경로를 만든다 — 프로덕션 번들에서 라우트를 빼는 길이 없다.
 * 그래서 화면 쪽이 이 판정으로 `Redirect`를 그린다. `__DEV__`를 화면이 직접 읽지 않는
 * 것은 그 전역이 대역을 안 받아 판정을 테스트할 수 없기 때문이다.
 */
export function isCatalogVisible(isDev: boolean): boolean {
  return isDev;
}
