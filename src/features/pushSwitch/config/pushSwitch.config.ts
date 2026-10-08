import Constants from "expo-constants";

export function readPushProjectId(): string | null {
  const eas = Constants.expoConfig?.extra?.eas as
    { projectId?: string } | undefined;

  return eas?.projectId ?? null;
}
