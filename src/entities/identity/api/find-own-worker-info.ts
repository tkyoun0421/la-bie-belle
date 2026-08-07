import "server-only";

import { findDefaultHourlyWage } from "@/entities/identity/api/find-default-hourly-wage";
import { GenderValueSchema } from "@/entities/identity/model/signup";
import type { OwnWorkerInfo } from "@/entities/identity/types/worker";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type FindOwnWorkerInfoResult =
  { ok: true; data: OwnWorkerInfo } | { ok: false; code: ErrorCode };

type OwnProfileRow = {
  name: string;
  gender: string;
  birth_date: string;
  phone: string;
  hourly_wage: number | null;
};

export async function findOwnWorkerInfo(): Promise<FindOwnWorkerInfoResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return { ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED };
  }

  const [profileResult, defaultWageResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, gender, birth_date, phone, hourly_wage")
      .eq("id", user.id)
      .maybeSingle(),
    findDefaultHourlyWage(),
  ]);

  if (profileResult.error) {
    process.stderr.write(
      `${JSON.stringify({
        event: "identity_find_own_worker_info_failed",
        code: profileResult.error.code,
      })}\n`,
    );
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  if (profileResult.data === null) {
    return { ok: false, code: ERROR_CODE.IDENTITY_PROFILE_REQUIRED };
  }

  if (!defaultWageResult.ok) {
    return { ok: false, code: defaultWageResult.code };
  }

  const profile = profileResult.data as OwnProfileRow;

  return {
    ok: true,
    data: {
      name: profile.name,
      gender: GenderValueSchema.parse(profile.gender),
      birthDate: profile.birth_date,
      phone: profile.phone,
      hourlyWage: profile.hourly_wage,
      defaultHourlyWage: defaultWageResult.data,
    },
  };
}
