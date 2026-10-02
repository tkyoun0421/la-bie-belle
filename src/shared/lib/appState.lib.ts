import { AppState } from "react-native";

/**
 * 앱이 앞뒤로 오가는 것을 알려주는 실물이다. `useSavePushTokenMutation`과
 * `wireAutoRefresh`가 이것을 받아 포그라운드 진입을 센다.
 *
 * **한 겹을 두는 까닭은 대역이 안 서기 때문이다.** node 갈래의 러너는 `react-native`를
 * `react-native-web`으로 잇는데 그쪽 `AppState`에는 `addEventListener`가 없다 — 실물을
 * 직접 무는 자리가 controller면 그 controller가 통째로 못 돈다. 기기에 붙는 것을 `lib`에
 * 모아 두는 규칙이기도 하다(`PUSH_DEPS`·`PHOTO_PICK_DEPS`와 같은 자리).
 */

export const APP_STATE = AppState;
