import "server-only";

import type { ApplicationCountEntry } from "@/entities/schedule/model/application-count";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type CountApplicationsByMonthParams = { scheduleIds: readonly string[] };

export type CountApplicationsByMonthResult =
  { ok: true; data: ApplicationCountEntry[] } | { ok: false; code: ErrorCode };

type ApplicationScheduleIdRow = { schedule_id: string };

export async function countApplicationsByMonth(
  params: CountApplicationsByMonthParams,
): Promise<CountApplicationsByMonthResult> {
  if (params.scheduleIds.length === 0) {
    return { ok: true, data: [] };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("applications")
    .select("schedule_id")
    .eq("status", "applied")
    .in("schedule_id", params.scheduleIds);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "scheduling_count_applications_by_month_failed", code: error.code })}\n`,
    );
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as ApplicationScheduleIdRow[]) {
    counts.set(row.schedule_id, (counts.get(row.schedule_id) ?? 0) + 1);
  }

  return {
    ok: true,
    data: Array.from(counts, ([scheduleId, count]) => ({ scheduleId, count })),
  };
}
