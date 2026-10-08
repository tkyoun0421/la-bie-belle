import type { PushPermission } from "@/entities/notification/model/reachState.policy";

export type PermissionResponse = { status: string };

export type RequestPushPermissionDeps = {
  platform: string;
  projectId: string | null;
  setNotificationChannelAsync: () => Promise<unknown>;
  requestPermissionsAsync: () => Promise<PermissionResponse>;
  getExpoPushTokenAsync: (options: {
    projectId: string;
  }) => Promise<{ data: string }>;
};

export type PushPermissionResult =
  | { permission: "denied" | "undetermined" }
  | { permission: "granted"; token: string | null };

const ANDROID = "android";

export function mapPermissionStatus({
  status,
}: PermissionResponse): PushPermission {
  if (status === "granted") {
    return "granted";
  }

  return status === "denied" ? "denied" : "undetermined";
}

export async function getPushPermission(
  getPermissionsAsync: () => Promise<PermissionResponse>,
): Promise<PushPermission> {
  return mapPermissionStatus(await getPermissionsAsync());
}

export async function requestPushPermission({
  platform,
  projectId,
  setNotificationChannelAsync,
  requestPermissionsAsync,
  getExpoPushTokenAsync,
}: RequestPushPermissionDeps): Promise<PushPermissionResult> {
  if (platform === ANDROID) {
    await setNotificationChannelAsync();
  }

  const permission = mapPermissionStatus(await requestPermissionsAsync());

  if (permission !== "granted") {
    return { permission };
  }

  if (projectId === null) {
    return { permission, token: null };
  }

  try {
    const { data } = await getExpoPushTokenAsync({ projectId });

    return { permission, token: data };
  } catch {
    return { permission, token: null };
  }
}
