import { useMemo } from "react";
import { supabase } from "@/shared/api/supabase";
import { monthIn } from "@/shared/utils/monthIn";
import { useServerNow } from "@/entities/clock/hooks/useServerNow";
import { useAttendanceMonthsQuery } from "@/features/stats/services/useAttendanceMonthsQuery";
import {
  adminAttendanceLine,
  adminAttendanceShares,
  type AdminAttendanceShare,
} from "@/features/stats/utils/attendanceLine.utils";
import {
  attendanceRowValue,
  buildAttendanceTab,
} from "@/features/stats/utils/attendanceRows.utils";

export type AdminStatsAttendanceRow = {
  key: string;
  displayName: string;
  value: string;
};

export type AdminStatsAttendanceController =
  | { state: "pending" }
  | { state: "failed" }
  | { state: "empty" }
  | {
      state: "ready";
      line: string;
      shares: AdminAttendanceShare[];
      rows: AdminStatsAttendanceRow[];
    };

export function useAdminStatsAttendance(
  month: string,
): AdminStatsAttendanceController {
  const months = useMemo(() => [month], [month]);

  const attendance = useAttendanceMonthsQuery(supabase, months);
  const serverNowMs = useServerNow();

  const shown = monthIn(attendance.data, month);

  const tab = useMemo(() => {
    const now = new Date(serverNowMs).toISOString();

    return buildAttendanceTab(
      shown?.days ?? [],
      shown?.attendance.checkIns ?? [],
      shown?.attendance.excuseStatuses ?? [],
      now,
    );
  }, [shown, serverNowMs]);

  if (attendance.isLoading) {
    return { state: "pending" };
  }

  if (attendance.error !== null) {
    return { state: "failed" };
  }

  if (tab.rows.length === 0) {
    return { state: "empty" };
  }

  return {
    state: "ready",
    line: adminAttendanceLine(tab.tally),
    shares: adminAttendanceShares(tab.tally),
    rows: tab.rows.map((row) => ({
      key: row.profileId,
      displayName: row.displayName,
      value: attendanceRowValue(row),
    })),
  };
}
