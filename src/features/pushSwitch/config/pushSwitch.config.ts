import Constants from "expo-constants";

/**
 * 기기 주소를 발급받을 때 실어 보내는 EAS 프로젝트 id다. 값은 `app.json`의
 * `extra.eas.projectId`에 산다.
 *
 * **비어도 안 던진다.** `readAppUrl`·`readSupabaseEnv`와 다른 틀인 것은, 아직 EAS 프로젝트를
 * 안 만들어 이 열쇠가 실제로 비어 있고 그 빈 상태가 「켰는데 기기가 없음」이라는 정해진
 * 갈래이기 때문이다(`docs/3-build/plans/notification-settings.md`의 「이 plan이 정본에 박은
 * 판정」). 던지면 알림을 켜려던 사람의 화면이 깨진다.
 *
 * **`process.env`가 아니라 `expo-constants`로 읽는다.** 이 값은 빌드 설정이 아니라 앱 설정
 * 파일에 살아 그 길밖에 없다 — `config/` 밖에서 `Constants`를 못 읽게 막는 축과,
 * `lib/`·`ui/`·`hooks/` 밖에서 `expo-*`를 못 당기게 막는 축이 이 한 파일에서 부딪히는
 * 자리다.
 */

export function readPushProjectId(): string | null {
  const eas = Constants.expoConfig?.extra?.eas as
    { projectId?: string } | undefined;

  return eas?.projectId ?? null;
}
