export type PushPermission = "undetermined" | "granted" | "denied";

export type ReachState =
  "loading" | "denied" | "off" | "no-device" | "reachable";

export type ReachInput = {
  notificationsEnabled: boolean | null;
  hasDevice: boolean | null;
  permission: PushPermission | null;
};

export function getReachState({
  notificationsEnabled,
  hasDevice,
  permission,
}: ReachInput): ReachState {
  if (
    notificationsEnabled === null ||
    hasDevice === null ||
    permission === null
  ) {
    return "loading";
  }

  if (permission === "denied") {
    return "denied";
  }

  if (!notificationsEnabled) {
    return "off";
  }

  return hasDevice ? "reachable" : "no-device";
}
