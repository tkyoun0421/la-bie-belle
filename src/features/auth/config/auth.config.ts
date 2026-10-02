import Constants from "expo-constants";

/**
 * 딥링크가 돌아올 주소를 고르려면 「지금 무엇이 앱을 돌리고 있나」를 알아야 한다. 그 값은
 * 코드에 박을 수 없고 런타임이 주므로 `config`가 읽는다 — 주소를 짜는 일은
 * `utils/authRedirect.utils.ts`가 한다.
 *
 * **`process.env`가 아니라 `expo-constants`로 읽는다.** 빌드 때 번들에 박히는 값이 아니라
 * 실행 중인 껍데기가 아는 값이다. `config/` 밖에서 `Constants`를 못 읽게 막는 축과
 * `lib/`·`ui/`·`hooks/` 밖에서 `expo-*`를 못 당기게 막는 축이 이 파일에서 부딪히고,
 * 알림의 `pushSwitch.config.ts`가 같은 자리에 먼저 섰다.
 */

/**
 * Expo Go 껍데기 안에서 돌고 있나. 그 껍데기는 번들을 내려받아 대신 돌리는 앱이라 우리
 * 스킴을 못 쓴다 — dev client와 스토어 빌드는 제 스킴을 가진다.
 */
export function readIsExpoGo(): boolean {
  return Constants.executionEnvironment === "storeClient";
}

/**
 * Expo Go 껍데기가 뜬 주소다 — `"192.168.0.10:8081"` 꼴이고 기계마다 다르다.
 *
 * **없으면 `undefined`고 널로 눕히지 않는다.** Expo Go 안에서는 늘 차 있고, 밖에서는 이
 * 값을 묻지 않는다 — 「켰는데 기기가 없음」처럼 정해진 갈래가 아니라서 빈 값에 뜻을 주면
 * 안 생기는 상태를 코드가 들게 된다.
 */
export function readExpoHostUri(): string | undefined {
  return Constants.expoConfig?.hostUri;
}
