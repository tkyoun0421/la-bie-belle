import type { AppStateStatus } from "react-native";

export function isForegroundEntry(
  previous: AppStateStatus | null,
  next: AppStateStatus,
): boolean {
  return next === "active" && previous !== "active";
}
