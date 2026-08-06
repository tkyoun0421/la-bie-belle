import { z } from "zod";

import { HOME_PATH, ONBOARDING_PATH, PENDING_PATH } from "@/shared/config/auth-routes.config";

export const PROFILE_STATUS_VALUES = [
  "pending",
  "active",
  "rejected",
  "dormant",
  "departed",
] as const;

export const ProfileStatusSchema = z.enum(PROFILE_STATUS_VALUES);
export type ProfileStatus = z.infer<typeof ProfileStatusSchema>;

export type ProfileGateProfile = { status: ProfileStatus };

export function resolveProfileGate(
  profile: ProfileGateProfile | null,
  pathname: string,
): string | null {
  if (profile === null) {
    return pathname === ONBOARDING_PATH ? null : ONBOARDING_PATH;
  }

  if (profile.status === "active") {
    return pathname === ONBOARDING_PATH || pathname === PENDING_PATH ? HOME_PATH : null;
  }

  return pathname === PENDING_PATH ? null : PENDING_PATH;
}
