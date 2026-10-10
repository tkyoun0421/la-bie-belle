import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { queryKeys } from "@/shared/api/queryKeys";
import { supabase } from "@/shared/api/supabase";
import { PAYROLL_PATH } from "@/shared/consts/navigation.const";
import { useMonthCursor } from "@/shared/hooks/useMonthCursor";
import { kstToday } from "@/shared/lib/kstToday.lib";
import { monthOf } from "@/shared/utils/kstDate";
import { tenThousandWonLabel } from "@/shared/utils/moneyLabel.utils";
import { monthIn } from "@/shared/utils/monthIn";
import { useServerNow } from "@/entities/clock/hooks/useServerNow";
import { usePayrollMonthsByMonthQuery } from "@/entities/payroll/services/usePayrollMonthsByMonthQuery";
import { useRehearsalMonthsQuery } from "@/entities/rehearsal/services/useRehearsalMonthsQuery";
import { useWorkMonthsQuery } from "@/entities/schedule/services/useWorkMonthsQuery";
import { useMyStanding } from "@/features/auth/hooks/useMyStanding";
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
import { buildMyAttendanceDays } from "@/features/stats/utils/attendanceDays.utils";
import { computeMyWorkTotals } from "@/features/stats/utils/myTotals.utils";
import { buildTrend, trendMonths } from "@/features/stats/utils/trend.utils";
import { MONTH_LENGTH, STATS_TABS } from "@/screens/stats/consts/stats.const";
import {
  joinPayrollByMonth,
  myAttendanceValues,
  myPayrollDaysOfMonth,
  myPayrollValues,
  myWorkValues,
} from "@/screens/stats/utils/chartValues.utils";

export type StatsTab = (typeof STATS_TABS)[number];

export type StatsListState =
  "loading" | "failed" | "empty" | "attendance" | "position" | "payroll";

export type StatsTrendPoint = {
  month: number;
  value: number | null;
};

export type StatsScreenController = {
  goBack: () => void;
  openPayrollHistory: () => void;
  tab: StatsTab;
  month: string;
  selectedMonth: number;
  points: StatsTrendPoint[];
  trendValueLabel: string | undefined;
  listState: StatsListState;
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
  const { month, goPrev, goNext } = useMonthCursor(monthOf(today));

  const { profile, isLoading: profileLoading } = useMyStanding(supabase);
  const serverNowMs = useServerNow();

  const months = useMemo(() => trendMonths(month), [month]);
  const now = new Date(serverNowMs).toISOString();
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
    selectedMonth: Number(month.slice(5, MONTH_LENGTH)),
    points,
    trendValueLabel:
      listState === "loading" || listState === "failed" || listState === "empty"
        ? undefined
        : tab === "attendance"
          ? `${values.get(month) ?? 0}%`
          : tab === "position"
            ? hoursLabel(totals.totalMinutes)
            : tenThousandWonLabel(payrollTotal),
    listState,
    payrollSpan: monthSpan(month),
    chooseTab: (value) => setTab(tabOf(value)),
    goPrev,
    goNext,
    retry: () => {
      for (const queryKey of RETRY_KEYS) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  };
}
