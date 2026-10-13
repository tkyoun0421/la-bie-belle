import { RETRY_PATH } from "@/shared/consts/navigation.const";

export type RehearsalGuardInput = {
  isAdmin: boolean;
  hasGrant: boolean;
  isLoading: boolean;
  failed: boolean;
};

export type RehearsalGuardMove =
  "allow" | "redirect-me" | "wait" | typeof RETRY_PATH;

export function resolveRehearsalGuard({
  isAdmin,
  hasGrant,
  isLoading,
  failed,
}: RehearsalGuardInput): RehearsalGuardMove {
  if (failed) {
    return RETRY_PATH;
  }

  if (isLoading) {
    return "wait";
  }

  return isAdmin || hasGrant ? "allow" : "redirect-me";
}
