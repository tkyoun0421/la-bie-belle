import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { readPushProjectId } from "@/features/pushSwitch/config/pushSwitch.config";
import {
  PUSH_CHANNEL_ID,
  PUSH_CHANNEL_NAME,
} from "@/features/pushSwitch/consts/pushSwitch.const";

/**
 * 기기에 붙는 함수들을 [`pushPermission.lib.ts`](pushPermission.lib.ts)가 받는 꼴로 묶는
 * 자리다. 판정은 저쪽이 하고 여기는 실물만 건넨다 — 판정이 `expo-notifications`를 직접 물면
 * 기기 없이는 안 돈다.
 *
 * **채널 이름과 프로젝트 id는 남이 든다.** 이름표는 `consts`가, 앱 설정에서 오는 id는
 * `config`가 들고 이 파일은 그것을 실어 SDK를 부른다 — 판정 쪽은 「채널을 세운다」만 알고
 * 무엇으로 세우는지는 모른다.
 */

export const PUSH_DEPS = {
  platform: Platform.OS,
  projectId: readPushProjectId(),
  getPermissionsAsync: () => Notifications.getPermissionsAsync(),
  setNotificationChannelAsync: () =>
    Notifications.setNotificationChannelAsync(PUSH_CHANNEL_ID, {
      name: PUSH_CHANNEL_NAME,
      importance: Notifications.AndroidImportance.DEFAULT,
    }),
  requestPermissionsAsync: () => Notifications.requestPermissionsAsync(),
  getExpoPushTokenAsync: (options: { projectId: string }) =>
    Notifications.getExpoPushTokenAsync(options),
};
