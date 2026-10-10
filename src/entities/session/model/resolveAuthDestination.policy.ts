import {
  BLOCKED_PATH,
  LEFT_PATH,
  LOGIN_PATH,
  PENDING_PATH,
  WORKER_HOME_PATH,
} from "@/shared/consts/navigation.const";
import type { AuthDestination } from "@/entities/session/model/session.type";

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
  LOGIN_PATH,
  PENDING_PATH,
  BLOCKED_PATH,
  LEFT_PATH,
];

export function resolveAuthDestination({
  hasSession,
  profile,
}: AuthStanding): AuthDestination {
  if (!hasSession) {
    return LOGIN_PATH;
  }

  if (!profile) {
    return PENDING_PATH;
  }

  if (profile.blockedAt) {
    return BLOCKED_PATH;
  }

  if (profile.leftAt) {
    return LEFT_PATH;
  }

  return profile.approvedAt ? WORKER_HOME_PATH : PENDING_PATH;
}

export function resolveGateMove(
  destination: AuthDestination,
  pathname: string,
): AuthDestination | null {
  if (GATE_PATHS.includes(pathname)) {
    return destination === pathname ? null : destination;
  }

  return destination === WORKER_HOME_PATH ? null : destination;
}
