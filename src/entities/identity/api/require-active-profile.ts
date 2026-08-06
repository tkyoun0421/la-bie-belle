import "server-only";

import { findOwnProfile } from "@/entities/identity/api/find-own-profile";
import type { ProfileGateProfile } from "@/entities/identity/model/profile-gate";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";

export type RequireActiveProfileResult =
  { ok: true; profile: ProfileGateProfile } | { ok: false; code: ErrorCode };

export async function requireActiveProfile(): Promise<RequireActiveProfileResult> {
  const profileResult = await findOwnProfile();

  if (!profileResult.ok) {
    return { ok: false, code: profileResult.code };
  }

  if (profileResult.data === null) {
    return { ok: false, code: ERROR_CODE.IDENTITY_PROFILE_REQUIRED };
  }

  if (profileResult.data.status !== "active") {
    return { ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE };
  }

  return { ok: true, profile: profileResult.data };
}
