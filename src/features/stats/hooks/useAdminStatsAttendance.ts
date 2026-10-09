import { useMemo } from "react";
import { supabase } from "@/shared/api/supabase";
import { monthIn } from "@/shared/utils/monthIn";
import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { serverClockStore } from "@/entities/clock/stores/clock.store";
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
  | { state: "loading" }
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
  const clockOffset = serverClockStore((at) => at.offset);

  const shown = monthIn(attendance.data, month);

  const tab = useMemo(() => {
    const now = new Date(nowWithOffset(Date.now(), clockOffset)).toISOString();

    return buildAttendanceTab(
      shown?.days ?? [],
      shown?.attendance.checkIns ?? [],
      shown?.attendance.excuseStatuses ?? [],
      now,
    );
  }, [shown, clockOffset]);

  if (attendance.isLoading) {
    return { state: "loading" };
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
