import { z } from "zod";

import {
  DEPARTED_PATH,
  DORMANT_PATH,
  HOME_PATH,
  LOGIN_PATH,
  ONBOARDING_PATH,
  PENDING_PATH,
  REJECTED_PATH,
} from "@/shared/config/auth-routes.config";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";

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
    return pathname === ONBOARDING_PATH ||
      pathname === PENDING_PATH ||
      pathname === REJECTED_PATH ||
      pathname === DORMANT_PATH ||
      pathname === DEPARTED_PATH
      ? HOME_PATH
      : null;
  }

  if (profile.status === "rejected") {
    return pathname === REJECTED_PATH ? null : REJECTED_PATH;
  }

  if (profile.status === "dormant") {
    return pathname === DORMANT_PATH ? null : DORMANT_PATH;
  }

  if (profile.status === "departed") {
    return pathname === DEPARTED_PATH ? null : DEPARTED_PATH;
  }

  return pathname === PENDING_PATH ? null : PENDING_PATH;
}

export type ProfileLookup =
  { ok: true; data: ProfileGateProfile | null } | { ok: false; code: ErrorCode };

export type ProfileAccessOutcome =
  { kind: "allow" } | { kind: "redirect"; to: string } | { kind: "error" };

export function resolveProfileAccess(
  lookup: ProfileLookup,
  pathname: string,
): ProfileAccessOutcome {
  if (!lookup.ok) {
    if (lookup.code === ERROR_CODE.COMMON_AUTH_REQUIRED) {
      return { kind: "redirect", to: LOGIN_PATH };
    }
    return { kind: "error" };
  }

  const target = resolveProfileGate(lookup.data, pathname);
  return target === null ? { kind: "allow" } : { kind: "redirect", to: target };
}
