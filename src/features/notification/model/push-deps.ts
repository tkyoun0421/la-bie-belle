import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * 기기에 붙는 함수들을 [`push-permission`](push-permission.ts)이 받는 꼴로 묶는 자리다.
 * 판정은 저쪽이 하고 여기는 실물만 건넨다 — 판정이 `expo-notifications`를 직접 물면 기기
 * 없이는 안 돈다.
 *
 * **채널 이름과 종류는 여기서만 안다.** 안드로이드 설정 화면에 그대로 뜨는 값이고 권한을 묻는
 * 순서(AC-06)와는 다른 층이라, 판정 쪽은 「채널을 세운다」만 알고 무엇으로 세우는지는 모른다.
 *
 * **`projectId`는 `app.json`의 `extra.eas.projectId`다.** Expo 푸시 주소가 EAS 프로젝트에
 * 묶여 있어 그 값 없이는 주소가 안 나온다. 아직 EAS 프로젝트를 안 만들어 그 열쇠가 비어 있고,
 * 그때는 `null`로 서서 「켰는데 기기가 없음」 갈래가 된다
 * (`docs/3-build/plans/notification-settings.md`의 「이 plan이 정본에 박은 판정」).
 */

const CHANNEL_ID = "default";

const CHANNEL_NAME = "근무 알림";

const eas = Constants.expoConfig?.extra?.eas as
  { projectId?: string } | undefined;

export const PUSH_DEPS = {
  platform: Platform.OS,
  projectId: eas?.projectId ?? null,
  getPermissionsAsync: () => Notifications.getPermissionsAsync(),
  setNotificationChannelAsync: () =>
    Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: CHANNEL_NAME,
      importance: Notifications.AndroidImportance.DEFAULT,
    }),
  requestPermissionsAsync: () => Notifications.requestPermissionsAsync(),
  getExpoPushTokenAsync: (options: { projectId: string }) =>
    Notifications.getExpoPushTokenAsync(options),
};
