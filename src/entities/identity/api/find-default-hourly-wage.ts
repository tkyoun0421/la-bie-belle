import "server-only";

import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type FindDefaultHourlyWageResult =
  { ok: true; data: number } | { ok: false; code: ErrorCode };

export async function findDefaultHourlyWage(): Promise<FindDefaultHourlyWageResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("venue_settings")
    .select("default_hourly_wage")
    .single();

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "identity_find_default_hourly_wage_failed", code: error.code })}\n`,
    );
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  return { ok: true, data: (data as { default_hourly_wage: number }).default_hourly_wage };
}
