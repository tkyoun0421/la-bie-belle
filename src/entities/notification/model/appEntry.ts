import type { AppStateStatus } from "react-native";

/**
 * 「매 진입」이 무엇인지를 정하는 자리다. 정본은
 * `docs/2-design/modules/notification/design.md`의 「기기 주소」다.
 *
 * **진입은 앱이 뜰 때 한 번과 포그라운드로 돌아올 때마다다.** 앞으로 돌아오는 자리를 넣는
 * 것은 사람이 앱을 띄워둔 채 기기 설정에서 권한을 켜고 오는 길이 있어서다 — 그 걸음이 앱을
 * 다시 띄우지 않으니 첫 진입만 보면 권한이 켜진 것을 다음에 앱을 죽였다 켤 때까지 모른다.
 *
 * **화면 사이를 오가는 것은 진입이 아니다.** `active`에서 `active`로 오는 전이가 여기 걸리면
 * 탭을 옮길 때마다 주소를 보낸다.
 *
 * 이전 상태가 `null`인 것은 앱이 막 떠 아직 아무것도 못 본 자리다 — 그 첫 `active`가 첫
 * 진입이다. 구독은 훅이 들고 이 함수는 전이만 받는다.
 */

export function isForegroundEntry(
  previous: AppStateStatus | null,
  next: AppStateStatus,
): boolean {
  return next === "active" && previous !== "active";
}
