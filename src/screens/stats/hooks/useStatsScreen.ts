import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { queryKeys } from "@/shared/api/queryKeys";
import { supabase } from "@/shared/api/supabase";
import { PAYROLL_PATH } from "@/shared/consts/navigation.const";
import { kstToday } from "@/shared/lib/kstToday.lib";
import { monthOf, shiftMonth, spellMonth } from "@/shared/utils/kstDate";
import {
  canGoToNextMonth,
  canGoToPreviousMonth,
} from "@/shared/utils/monthBoundary";
import { monthIn } from "@/shared/utils/monthIn";
import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { serverClockStore } from "@/entities/clock/stores/clock.store";
import { usePayrollMonthsByMonthQuery } from "@/entities/payroll/services/usePayrollMonthsByMonthQuery";
import { useMyProfileRowQuery } from "@/entities/profile/services/useMyProfileRowQuery";
import { useRehearsalMonthsQuery } from "@/entities/rehearsal/services/useRehearsalMonthsQuery";
import { useFirstScheduleMonthQuery } from "@/entities/schedule/services/useFirstScheduleMonthQuery";
import { useWorkMonthsQuery } from "@/entities/schedule/services/useWorkMonthsQuery";
import { useSessionUserQuery } from "@/entities/session/services/useSessionUserQuery";
import {
  monthSpan,
  type DateSpan,
} from "@/features/payrollCompute/model/dateSpan.policy";
import type { MyWorkTotals } from "@/features/stats/model/stats.type";
import {
  hoursLabel,
  workInputsOf,
} from "@/features/stats/model/workTotals.policy";
import { useAttendanceMonthsQuery } from "@/features/stats/services/useAttendanceMonthsQuery";
import { computeMyWorkTotals } from "@/features/stats/utils/myTotals.utils";
import { buildTrend, trendMonths } from "@/features/stats/utils/trend.utils";
import {
  MONTH_LENGTH,
  STATS_COPY,
  STATS_TABS,
} from "@/screens/stats/consts/stats.const";
import {
  buildMyAttendanceDays,
  myAttendanceRow,
} from "@/screens/stats/utils/attendanceDays.utils";
import {
  attendanceRatioShares,
  type AttendanceShare,
} from "@/screens/stats/utils/attendanceShares.utils";
import { myAttendanceTally } from "@/screens/stats/utils/attendanceTally.utils";
import {
  joinPayrollByMonth,
  myAttendanceValues,
  myPayrollDaysOfMonth,
  myPayrollValues,
  myWorkValues,
} from "@/screens/stats/utils/chartValues.utils";
import { tenThousandWonLabel } from "@/screens/stats/utils/moneyLabel.utils";
import { monthAttendanceLine } from "@/screens/stats/utils/monthAttendanceLine.utils";

export type StatsTab = (typeof STATS_TABS)[number];

export type StatsListState =
  "loading" | "failed" | "empty" | "attendance" | "position" | "payroll";

export type StatsRow = {
  key: string;
  title: string;
  detail: string;
  value: string;
  weight: number;
};

export type StatsTrendPoint = {
  month: number;
  value: number | null;
};

export type StatsScreenController = {
  goBack: () => void;
  openPayrollHistory: () => void;
  tab: StatsTab;
  month: string;
  monthLabel: string;
  selectedMonth: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  points: StatsTrendPoint[];
  trendValueLabel: string | undefined;
  listState: StatsListState;
  attendanceLine: string;
  shares: AttendanceShare[];
  attendanceRows: StatsRow[];
  positionRows: StatsRow[];
  totalLabel: string;
  payrollSpan: DateSpan;
  chooseTab: (value: string) => void;
  goPrev: () => void;
  goNext: () => void;
  retry: () => void;
};

const NO_MONTHS: string[] = [];

const RETRY_KEYS = [
  queryKeys.schedule.all,
  queryKeys.attendance.all,
  queryKeys.payroll.all,
  queryKeys.rehearsal.all,
];

function tabOf(value: string): StatsTab {
  return STATS_TABS.find((tab) => tab === value) ?? STATS_TABS[0];
}

export function useStatsScreen(): StatsScreenController {
  const router = useRouter();
  const queryClient = useQueryClient();
  const today = kstToday();

  const [tab, setTab] = useState<StatsTab>(STATS_TABS[0]);
  const [month, setMonth] = useState(() => monthOf(today));

  const { data: me } = useSessionUserQuery(supabase);
  const { data: profile, isLoading: profileLoading } = useMyProfileRowQuery(
    supabase,
    me?.id ?? null,
  );
  const clockOffset = serverClockStore((at) => at.offset);

  const months = useMemo(() => trendMonths(month), [month]);
  const now = new Date(nowWithOffset(Date.now(), clockOffset)).toISOString();
  const profileId = profile?.id ?? null;

  const work = useWorkMonthsQuery(
    supabase,
    tab === "attendance" ? NO_MONTHS : months,
  );
  const attendance = useAttendanceMonthsQuery(
    supabase,
    tab === "attendance" ? months : NO_MONTHS,
  );
  const payroll = usePayrollMonthsByMonthQuery(
    supabase,
    tab === "payroll" ? months : NO_MONTHS,
  );
  const rehearsal = useRehearsalMonthsQuery(
    supabase,
    tab === "payroll" ? months : NO_MONTHS,
  );
  const firstMonth = useFirstScheduleMonthQuery(supabase);

  const sources: readonly { isLoading: boolean; error: Error | null }[] =
    tab === "attendance"
      ? [attendance]
      : tab === "position"
        ? [work]
        : [work, payroll, rehearsal];

  const loading = profileLoading || sources.some((one) => one.isLoading);
  const failed = sources.some((one) => one.error !== null);

  const shownAttendance = monthIn(attendance.data, month);
  const shownWork = monthIn(work.data, month);

  const tally = useMemo(
    () =>
      myAttendanceTally(
        shownAttendance?.days ?? [],
        shownAttendance?.attendance.checkIns ?? [],
        shownAttendance?.attendance.excuseStatuses ?? [],
        profileId,
        now,
      ),
    [shownAttendance, profileId, now],
  );

  const attendanceDays = useMemo(
    () =>
      profileId === null || shownAttendance === undefined
        ? []
        : buildMyAttendanceDays(
            profileId,
            shownAttendance.days,
            shownAttendance.attendance.checkIns,
            shownAttendance.attendance.excuseStatuses,
            now,
          ),
    [profileId, shownAttendance, now],
  );

  const totals = useMemo<MyWorkTotals>(() => {
    if (profileId === null) {
      return { totalMinutes: 0, totalCount: 0, byPosition: [] };
    }

    const inputs = workInputsOf(shownWork?.days ?? []);

    return computeMyWorkTotals(inputs.assignments, inputs.days, profileId);
  }, [shownWork, profileId]);

  const payrollLoaded = useMemo(
    () => joinPayrollByMonth(work.data, payroll.data),
    [work.data, payroll.data],
  );

  const payrollDays = useMemo(
    () =>
      myPayrollDaysOfMonth(
        payrollLoaded,
        month,
        profileId,
        now,
        rehearsal.data ?? [],
      ),
    [payrollLoaded, month, profileId, rehearsal.data, now],
  );

  const values = useMemo(() => {
    if (profileId === null) {
      return new Map<string, number>();
    }

    return tab === "attendance"
      ? myAttendanceValues(attendance.data, profileId, now)
      : tab === "position"
        ? myWorkValues(work.data, profileId)
        : myPayrollValues(payrollLoaded, profileId, now, rehearsal.data ?? []);
  }, [
    tab,
    profileId,
    attendance.data,
    work.data,
    payrollLoaded,
    rehearsal.data,
    now,
  ]);

  const points = useMemo(
    () =>
      buildTrend(months, values).map((point) => ({
        month: Number(point.month.slice(5, MONTH_LENGTH)),
        value: point.value,
      })),
    [months, values],
  );

  const empty =
    tab === "attendance"
      ? attendanceDays.length === 0
      : tab === "position"
        ? totals.totalCount === 0
        : payrollDays.length === 0;

  const listState: StatsListState = loading
    ? "loading"
    : failed
      ? "failed"
      : empty
        ? "empty"
        : tab;

  const payrollTotal = values.get(month) ?? 0;
  const totalLabel = hoursLabel(totals.totalMinutes);

  const goBack = useCallback(() => router.back(), [router]);

  const openPayrollHistory = useCallback(
    () => router.push(PAYROLL_PATH),
    [router],
  );

  return {
    goBack,
    openPayrollHistory,
    tab,
    month,
    monthLabel: spellMonth(month),
    selectedMonth: Number(month.slice(5, MONTH_LENGTH)),
    canGoPrev:
      firstMonth.data != null && canGoToPreviousMonth(month, firstMonth.data),
    canGoNext: canGoToNextMonth(month, today),
    points,
    trendValueLabel:
      listState === "loading" || listState === "failed" || listState === "empty"
        ? undefined
        : tab === "attendance"
          ? `${values.get(month) ?? 0}%`
          : tab === "position"
            ? totalLabel
            : tenThousandWonLabel(payrollTotal),
    listState,
    attendanceLine: monthAttendanceLine(tally),
    shares: attendanceRatioShares(tally),
    attendanceRows: attendanceDays.map((day) => {
      const row = myAttendanceRow(day);

      return {
        key: day.workDate,
        title: row.title,
        detail: row.subtitle,
        value: row.value,
        weight: 0,
      };
    }),
    positionRows: totals.byPosition.map((row) => ({
      key: row.position,
      title: row.position,
      detail: `${row.count}${STATS_COPY.countSuffix}`,
      value: hoursLabel(row.minutes),
      weight: row.minutes,
    })),
    totalLabel,
    payrollSpan: monthSpan(month),
    chooseTab: (value) => setTab(tabOf(value)),
    goPrev: () => setMonth(shiftMonth(month, -1)),
    goNext: () => setMonth(shiftMonth(month, 1)),
    retry: () => {
      for (const queryKey of RETRY_KEYS) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  };
}
