import { useMemo } from "react";
import { supabase } from "@/shared/api/supabase";
import { fragmentOf } from "@/shared/model/fragmentState.policy";
import { monthIn } from "@/shared/utils/monthIn";
import { useServerNow } from "@/entities/clock/hooks/useServerNow";
import { serverNowIso } from "@/entities/clock/model/serverClock.policy";
import { useAttendanceMonthsQuery } from "@/features/stats/services/useAttendanceMonthsQuery";
import {
  attendanceRowValue,
  buildAttendanceTab,
} from "@/features/stats/utils/attendanceRows.utils";
import {
  attendanceRatioShares,
  type AttendanceShare,
} from "@/features/stats/utils/attendanceShares.utils";
import { monthAttendanceLine } from "@/features/stats/utils/monthAttendanceLine.utils";

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
      shares: AttendanceShare[];
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
    const now = serverNowIso(serverNowMs);

    return buildAttendanceTab(
      shown?.days ?? [],
      shown?.attendance.checkIns ?? [],
      shown?.attendance.excuseStatuses ?? [],
      now,
    );
  }, [shown, serverNowMs]);

  return fragmentOf(attendance, {
    empty: () => tab.rows.length === 0,
    ready: () => ({
      line: monthAttendanceLine(tab.tally),
      shares: attendanceRatioShares(tab.tally),
      rows: tab.rows.map((row) => ({
        key: row.profileId,
        displayName: row.displayName,
        value: attendanceRowValue(row),
      })),
    }),
  });
}
