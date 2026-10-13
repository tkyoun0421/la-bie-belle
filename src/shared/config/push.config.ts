import Constants from "expo-constants";

function projectIdOf(eas: unknown): string | null {
  if (typeof eas !== "object" || eas === null || !("projectId" in eas)) {
    return null;
  }

  return typeof eas.projectId === "string" ? eas.projectId : null;
}

export function readPushProjectId(): string | null {
  return projectIdOf(Constants.expoConfig?.extra?.eas);
}
