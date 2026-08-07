import "server-only";

import { findDefaultHourlyWage } from "@/entities/identity/api/find-default-hourly-wage";
import { ProfileStatusSchema } from "@/entities/identity/model/profile-gate";
import {
  matchesGenderRequirement,
  type GenderRequirement,
} from "@/entities/identity/model/position-eligibility";
import { GenderValueSchema } from "@/entities/identity/model/signup";
import type { WorkerDetail, WorkerPosition } from "@/entities/identity/types/worker";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type FindWorkerDetailResult =
  { ok: true; data: WorkerDetail | null } | { ok: false; code: ErrorCode };

type ProfileRow = {
  id: string;
  name: string;
  gender: string;
  birth_date: string;
  phone: string;
  status: string;
  hourly_wage: number | null;
};
type PositionRow = {
  id: string;
  name: string;
  is_default: boolean;
  gender_requirement: GenderRequirement;
};
type EligibilityRow = { position_id: string };

function logFailure(event: string, code: string | undefined) {
  process.stderr.write(`${JSON.stringify({ event, code })}\n`);
}

export async function findWorkerDetail(profileId: string): Promise<FindWorkerDetailResult> {
  const supabase = await createSupabaseServerClient();

  const [profileResult, positionsResult, eligibilitiesResult, defaultWageResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, gender, birth_date, phone, status, hourly_wage")
        .eq("id", profileId)
        .maybeSingle(),
      supabase
        .from("positions")
        .select("id, name, is_default, gender_requirement")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("worker_position_eligibilities")
        .select("position_id")
        .eq("profile_id", profileId),
      findDefaultHourlyWage(),
    ]);

  if (profileResult.error) {
    logFailure("identity_find_worker_detail_profile_failed", profileResult.error.code);
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }
  if (positionsResult.error) {
    logFailure("identity_find_worker_detail_positions_failed", positionsResult.error.code);
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }
  if (eligibilitiesResult.error) {
    logFailure("identity_find_worker_detail_eligibilities_failed", eligibilitiesResult.error.code);
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }
  if (!defaultWageResult.ok) {
    return { ok: false, code: defaultWageResult.code };
  }

  if (profileResult.data === null) {
    return { ok: true, data: null };
  }

  const grantedIds = new Set(
    ((eligibilitiesResult.data ?? []) as EligibilityRow[]).map((row) => row.position_id),
  );

  const profile = profileResult.data as ProfileRow;
  const gender = GenderValueSchema.parse(profile.gender);

  const positions: WorkerPosition[] = ((positionsResult.data ?? []) as PositionRow[])
    .filter((row) => !row.is_default || matchesGenderRequirement(row.gender_requirement, gender))
    .map((row) => ({
      id: row.id,
      name: row.name,
      isDefault: row.is_default,
      granted: row.is_default ? true : grantedIds.has(row.id),
    }));

  return {
    ok: true,
    data: {
      id: profile.id,
      name: profile.name,
      gender,
      birthDate: profile.birth_date,
      phone: profile.phone,
      status: ProfileStatusSchema.parse(profile.status),
      hourlyWage: profile.hourly_wage,
      defaultHourlyWage: defaultWageResult.data,
      positions,
    },
  };
}
