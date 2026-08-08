import "server-only";

import type { ApplicationCountEntry } from "@/entities/schedule/model/application-count";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type CountApplicationsByMonthParams = {
  scheduleIds: readonly string[];
  pageSize?: number;
};

export type CountApplicationsByMonthResult =
  { ok: true; data: ApplicationCountEntry[] } | { ok: false; code: ErrorCode };

type ApplicationScheduleIdRow = { schedule_id: string };

const DEFAULT_PAGE_SIZE = 1000;

export async function countApplicationsByMonth(
  params: CountApplicationsByMonthParams,
): Promise<CountApplicationsByMonthResult> {
  if (params.scheduleIds.length === 0) {
    return { ok: true, data: [] };
  }

  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const supabase = await createSupabaseServerClient();
  const counts = new Map<string, number>();
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("applications")
      .select("schedule_id")
      .eq("status", "applied")
      .in("schedule_id", params.scheduleIds)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      process.stderr.write(
        `${JSON.stringify({ event: "scheduling_count_applications_by_month_failed", code: error.code })}\n`,
      );
      return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
    }

    const rows = (data ?? []) as ApplicationScheduleIdRow[];
    for (const row of rows) {
      counts.set(row.schedule_id, (counts.get(row.schedule_id) ?? 0) + 1);
    }

    if (rows.length < pageSize) {
      break;
    }
    from += pageSize;
  }

  return {
    ok: true,
    data: Array.from(counts, ([scheduleId, count]) => ({ scheduleId, count })),
  };
}
