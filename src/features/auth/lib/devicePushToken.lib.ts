export type DevicePushTokenDeps = {
  projectId: string | null;
  getPermissionsAsync: () => Promise<{ status: string }>;
  getExpoPushTokenAsync: (options: {
    projectId: string;
  }) => Promise<{ data: string }>;
};

async function loadDeviceDeps(): Promise<DevicePushTokenDeps> {
  const [{ readPushProjectId }, Notifications] = await Promise.all([
    import("@/shared/config/push.config"),
    import("expo-notifications"),
  ]);

  return {
    projectId: readPushProjectId(),
    getPermissionsAsync: () => Notifications.getPermissionsAsync(),
    getExpoPushTokenAsync: (options) =>
      Notifications.getExpoPushTokenAsync(options),
  };
}

export async function readGrantedPushToken(
  deps?: DevicePushTokenDeps,
): Promise<string | null> {
  try {
    const { projectId, getPermissionsAsync, getExpoPushTokenAsync } =
      deps ?? (await loadDeviceDeps());

    if (projectId === null) {
      return null;
    }

    const { status } = await getPermissionsAsync();

    if (status !== "granted") {
      return null;
    }

    const { data } = await getExpoPushTokenAsync({ projectId });

    return data;
  } catch {
    return null;
  }
}
