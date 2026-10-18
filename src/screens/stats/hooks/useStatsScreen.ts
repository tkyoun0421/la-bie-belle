import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { queryKeys } from "@/shared/api/queryKeys";
import { supabase } from "@/shared/api/supabase";
import { PAYROLL_PATH } from "@/shared/consts/navigation.const";
import { useMonthCursor } from "@/shared/hooks/useMonthCursor";
import { fragmentOf } from "@/shared/model/fragmentState.policy";
import { monthOf } from "@/shared/utils/kstDate";
import { monthIn } from "@/shared/utils/monthIn";
import { useServerNow } from "@/entities/clock/hooks/useServerNow";
import { useServerToday } from "@/entities/clock/hooks/useServerToday";
import { serverNowIso } from "@/entities/clock/model/serverClock.policy";
import { usePayrollMonthsByMonthQuery } from "@/entities/payroll/services/usePayrollMonthsByMonthQuery";
import { useRehearsalMonthsQuery } from "@/entities/rehearsal/services/useRehearsalMonthsQuery";
import { useWorkMonthsQuery } from "@/entities/schedule/services/useWorkMonthsQuery";
import { useMyStanding } from "@/features/auth/hooks/useMyStanding";
import {
  monthSpan,
  type DateSpan,
} from "@/features/payrollCompute/model/dateSpan.policy";
import { hoursLabel } from "@/features/stats/model/workTotals.policy";
import { useAttendanceMonthsQuery } from "@/features/stats/services/useAttendanceMonthsQuery";
import { buildMyAttendanceDays } from "@/features/stats/utils/attendanceDays.utils";
import { myWorkTotalsOfMonth } from "@/features/stats/utils/myTotals.utils";
import { buildTrend, trendMonths } from "@/features/stats/utils/trend.utils";
import { MONTH_LENGTH, STATS_TABS } from "@/screens/stats/consts/stats.const";
import {
  joinPayrollByMonth,
  myAttendanceLabel,
  myAttendanceValues,
  myPayrollDaysOfMonth,
  myPayrollLabel,
  myPayrollValues,
  myWorkValues,
} from "@/screens/stats/utils/myChartValues.utils";

export type StatsTab = (typeof STATS_TABS)[number];

export type StatsListState =
  | { state: "pending" }
  | { state: "failed" }
  | { state: "empty" }
  | { state: "ready"; tab: StatsTab };

export type StatsTrendPoint = {
  month: number;
  value: number | null;
};

export type StatsScreenController = {
  goBack: () => void;
  openPayrollHistory: () => void;
  profileId: string | null;
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
  const today = useServerToday();

  const [tab, setTab] = useState<StatsTab>(STATS_TABS[0]);
  const { month, goPrev, goNext } = useMonthCursor(monthOf(today));

  const { profile, isLoading: profileLoading } = useMyStanding(supabase);
  const serverNowMs = useServerNow();

  const months = useMemo(() => trendMonths(month), [month]);
  const now = serverNowIso(serverNowMs);
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

  const sourcesOf: Record<
    StatsTab,
    readonly { isLoading: boolean; error: Error | null }[]
  > = {
    attendance: [attendance],
    position: [work],
    payroll: [work, payroll, rehearsal],
  };

  const sources = sourcesOf[tab];

  const loading = profileLoading || sources.some((one) => one.isLoading);
  const failure = sources.find((one) => one.error !== null)?.error ?? null;

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

  const totals = useMemo(
    () => myWorkTotalsOfMonth(shownWork, profileId),
    [shownWork, profileId],
  );

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

    const valuesOf: Record<StatsTab, () => Map<string, number>> = {
      attendance: () => myAttendanceValues(attendance.data, profileId, now),
      position: () => myWorkValues(work.data, profileId),
      payroll: () =>
        myPayrollValues(payrollLoaded, profileId, now, rehearsal.data ?? []),
    };

    return valuesOf[tab]();
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

  const listState: StatsListState = fragmentOf(
    { data: loading ? undefined : tab, error: failure },
    {
      empty: () => empty,
      ready: () => ({ tab }),
    },
  );

  const trendLabels: Record<StatsTab, string> = {
    attendance: myAttendanceLabel(values, month),
    position: hoursLabel(totals.totalMinutes),
    payroll: myPayrollLabel(values, month),
  };

  const goBack = useCallback(() => router.back(), [router]);

  const openPayrollHistory = useCallback(
    () => router.push(PAYROLL_PATH),
    [router],
  );

  return {
    goBack,
    openPayrollHistory,
    profileId,
    tab,
    month,
    selectedMonth: Number(month.slice(5, MONTH_LENGTH)),
    points,
    trendValueLabel:
      listState.state === "ready" ? trendLabels[listState.tab] : undefined,
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
