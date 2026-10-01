/**
 * 개발 빌드에만 있는 문(`/__test/session`)이 쓰는 둘이다 — 문이 열려 있는지와, 문이 켜두고
 * 간 「다음 프로필 읽기 한 번을 실패시켜라」 표시다.
 *
 * Expo Router는 파일이 있으면 경로를 만든다 — 프로덕션 번들에서 라우트를 빼는 길이 없다.
 * 그래서 화면 쪽이 이 판정으로 `Redirect`를 그린다. `__DEV__`를 화면이 직접 읽지 않는 것은
 * 그 전역이 대역을 안 받아 판정을 테스트할 수 없기 때문이고, `catalog-visibility.ts`가 조각
 * 목록에 같은 꼴로 서 있다.
 *
 * 표시가 한 번 쓰이고 꺼지는 것은 `/retry`의 「다시 시도」가 진짜 읽기를 하게 두려는 것이다.
 * 계속 켜져 있으면 무엇을 확인한 것인지 흐려진다. 프로덕션에서는 이 표시를 켜는 유일한
 * 자리인 문 자체가 닫혀 있어서 늘 꺼진 채다.
 *
 * 근거는 `docs/4-test/execution.md`의 「`pnpm e2e`」 절이다.
 */

export function isDevDoorOpen(isDev: boolean): boolean {
  return isDev;
}

let profileReadFailureArmed = false;

export function armProfileReadFailure(): void {
  profileReadFailureArmed = true;
}

export function takeProfileReadFailure(): boolean {
  const armed = profileReadFailureArmed;

  profileReadFailureArmed = false;

  return armed;
}
