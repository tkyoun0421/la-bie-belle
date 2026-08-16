export type PushSupportState =
  "unsupported" | "ios-not-installed" | "permission-denied" | "ready" | "subscribed";

export type PushSupportInput = {
  pushApiSupported: boolean;
  isIos: boolean;
  isStandalone: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
};

export function resolvePushSupportState(input: PushSupportInput): PushSupportState {
  if (!input.pushApiSupported) {
    return "unsupported";
  }
  if (input.isIos && !input.isStandalone) {
    return "ios-not-installed";
  }
  if (input.permission === "denied") {
    return "permission-denied";
  }
  if (input.subscribed) {
    return "subscribed";
  }
  return "ready";
}
