import "server-only";

import { ProfileStatusSchema, type ProfileStatus } from "@/entities/identity/model/profile-gate";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type OwnDormancyProfile = { status: ProfileStatus; inactivityAnchorAt: string | null };

export type FindOwnDormancyProfileResult =
  { ok: true; data: OwnDormancyProfile | null } | { ok: false; code: ErrorCode };

type OwnDormancyRow = { status: string; inactivity_anchor_at: string | null };

export async function findOwnDormancyProfile(): Promise<FindOwnDormancyProfileResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return { ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("status, inactivity_anchor_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "identity_find_own_dormancy_profile_failed", code: error.code })}\n`,
    );
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  if (data === null) {
    return { ok: true, data: null };
  }

  const row = data as OwnDormancyRow;

  return {
    ok: true,
    data: {
      status: ProfileStatusSchema.parse(row.status),
      inactivityAnchorAt: row.inactivity_anchor_at,
    },
  };
}
