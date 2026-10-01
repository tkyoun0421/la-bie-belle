import type { FontLoadingState } from "@/shared/model/font.type";

/**
 * 서체가 떴는지로 앱을 그릴지와 스플래시를 내릴지를 판정한다. 자산 표와 타입은 각자
 * `consts`와 `model`에 살고 여기는 순수한 두 판정만 든다.
 */

export function shouldRenderApp({ loaded, error }: FontLoadingState): boolean {
  return loaded || error !== null;
}

/**
 * 테마 복원이 셋째 조건이다. 저장소에서 고른 화면을 읽기 전에 스플래시를 내리면 어둡게
 * 고른 사람이 흰 화면을 한 프레임 보고 나서 어두워진다
 * (`docs/2-design/modules/account/screens/profile.md`의 「화면」). 기본값이 참인 것은
 * 테마를 안 기다리는 자리가 이 인자를 안 주고도 그대로 서게 하려는 것이다.
 */
export function shouldDismissSplash(
  state: FontLoadingState,
  alreadyDismissed: boolean,
  themeRestored: boolean = true,
): boolean {
  return !alreadyDismissed && themeRestored && shouldRenderApp(state);
}
