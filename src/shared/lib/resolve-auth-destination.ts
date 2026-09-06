export type AuthDestination = "/login" | "/pending" | "/";

export type AuthStanding = {
  hasSession: boolean;
  approvedAt: string | null;
};

export function resolveAuthDestination({
  hasSession,
  approvedAt,
}: AuthStanding): AuthDestination {
  if (!hasSession) {
    return "/login";
  }

  return approvedAt ? "/" : "/pending";
}
