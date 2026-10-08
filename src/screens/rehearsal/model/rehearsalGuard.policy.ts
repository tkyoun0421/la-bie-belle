export type RehearsalGuardInput = {
  isAdmin: boolean;
  hasGrant: boolean;
  isLoading: boolean;
};

export type RehearsalGuardMove = "allow" | "redirect-me" | "wait";

export function resolveRehearsalGuard({
  isAdmin,
  hasGrant,
  isLoading,
}: RehearsalGuardInput): RehearsalGuardMove {
  if (isLoading) {
    return "wait";
  }

  return isAdmin || hasGrant ? "allow" : "redirect-me";
}
