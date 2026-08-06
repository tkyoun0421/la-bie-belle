import "server-only";

import {
  ProfileStatusSchema,
  type ProfileGateProfile,
} from "@/entities/identity/model/profile-gate";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";

export type OwnProfile = ProfileGateProfile | null;

export type FindOwnProfileResult = { ok: true; data: OwnProfile } | { ok: false; code: ErrorCode };

export async function findOwnProfile(userId?: string): Promise<FindOwnProfileResult> {
  const supabase = await createSupabaseServerClient();

  let resolvedUserId = userId;
  if (resolvedUserId === undefined) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user === null) {
      return { ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED };
    }
    resolvedUserId = user.id;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", resolvedUserId)
    .maybeSingle();

  if (error) {
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  return {
    ok: true,
    data: data === null ? null : { status: ProfileStatusSchema.parse(data.status) },
  };
}
