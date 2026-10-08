import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { readPushProjectId } from "@/features/pushSwitch/config/pushSwitch.config";
import {
  PUSH_CHANNEL_ID,
  PUSH_CHANNEL_NAME,
} from "@/features/pushSwitch/consts/pushSwitch.const";

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
