import { useMemo } from "react";
import { supabase } from "@/shared/api/supabase";
import { fragmentOf } from "@/shared/model/fragmentState.policy";
import { monthIn } from "@/shared/utils/monthIn";
import { useServerNow } from "@/entities/clock/hooks/useServerNow";
import { useMyProfileRowQuery } from "@/entities/profile/services/useMyProfileRowQuery";
import { useSessionUserQuery } from "@/entities/session/services/useSessionUserQuery";
import { useAttendanceMonthsQuery } from "@/features/stats/services/useAttendanceMonthsQuery";
import {
  buildMyAttendanceDays,
  myAttendanceRow,
} from "@/features/stats/utils/attendanceDays.utils";
import {
  attendanceRatioShares,
  type AttendanceShare,
} from "@/features/stats/utils/attendanceShares.utils";
import { myAttendanceTally } from "@/features/stats/utils/attendanceTally.utils";
import { monthAttendanceLine } from "@/features/stats/utils/monthAttendanceLine.utils";

export type StatsAttendanceRow = {
  key: string;
  title: string;
  detail: string;
  value: string;
};

export type StatsAttendanceController =
  | { state: "pending" }
  | { state: "failed" }
  | { state: "empty" }
  | {
      state: "ready";
      line: string;
      shares: AttendanceShare[];
      rows: StatsAttendanceRow[];
    };

export function useStatsAttendance(month: string): StatsAttendanceController {
  const months = useMemo(() => [month], [month]);

  const { data: me } = useSessionUserQuery(supabase);
  const profile = useMyProfileRowQuery(supabase, me?.id ?? null);
  const attendance = useAttendanceMonthsQuery(supabase, months);
  const serverNowMs = useServerNow();

  const profileId = profile.data?.id ?? null;
  const now = new Date(serverNowMs).toISOString();
  const shown = monthIn(attendance.data, month);

  const days = useMemo(
    () =>
      profileId === null || shown === undefined
        ? []
        : buildMyAttendanceDays(
            profileId,
            shown.days,
            shown.attendance.checkIns,
            shown.attendance.excuseStatuses,
            now,
          ),
    [profileId, shown, now],
  );

  const tally = useMemo(
    () =>
      myAttendanceTally(
        shown?.days ?? [],
        shown?.attendance.checkIns ?? [],
        shown?.attendance.excuseStatuses ?? [],
        profileId,
        now,
      ),
    [shown, profileId, now],
  );

  return fragmentOf([profile, attendance], {
    empty: () => days.length === 0,
    ready: () => ({
      line: monthAttendanceLine(tally),
      shares: attendanceRatioShares(tally),
      rows: days.map((day) => {
        const row = myAttendanceRow(day);

        return {
          key: day.workDate,
          title: row.title,
          detail: row.subtitle,
          value: row.value,
        };
      }),
    }),
  });
}
