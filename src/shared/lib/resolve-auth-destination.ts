export type AuthDestination =
  "/login" | "/pending" | "/blocked" | "/left" | "/";

export type ProfileStanding = {
  approvedAt: string | null;
  blockedAt: string | null;
  leftAt: string | null;
};

export type AuthStanding = {
  hasSession: boolean;
  profile: ProfileStanding | null;
};

const GATE_PATHS: readonly string[] = [
  "/login",
  "/pending",
  "/blocked",
  "/left",
];

export function resolveAuthDestination({
  hasSession,
  profile,
}: AuthStanding): AuthDestination {
  if (!hasSession) {
    return "/login";
  }

  if (!profile) {
    return "/pending";
  }

  if (profile.blockedAt) {
    return "/blocked";
  }

  if (profile.leftAt) {
    return "/left";
  }

  return profile.approvedAt ? "/" : "/pending";
}

export function resolveGateMove(
  destination: AuthDestination,
  pathname: string,
): AuthDestination | null {
  if (GATE_PATHS.includes(pathname)) {
    return destination === pathname ? null : destination;
  }

  return destination === "/" ? null : destination;
}
