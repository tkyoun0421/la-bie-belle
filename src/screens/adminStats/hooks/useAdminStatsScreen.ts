import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { queryKeys } from "@/shared/api/queryKeys";
import { supabase } from "@/shared/api/supabase";
import { NO_VALUE } from "@/shared/consts/noValue.const";
import { useMonthCursor } from "@/shared/hooks/useMonthCursor";
import { kstToday } from "@/shared/lib/kstToday.lib";
import { monthOf } from "@/shared/utils/kstDate";
import { monthIn } from "@/shared/utils/monthIn";
import { useServerNow } from "@/entities/clock/hooks/useServerNow";
import { useWorkMonthsQuery } from "@/entities/schedule/services/useWorkMonthsQuery";
import {
  computeWorkTotals,
  hoursLabel,
  workInputsOf,
} from "@/features/stats/model/workTotals.policy";
import { useAttendanceMonthsQuery } from "@/features/stats/services/useAttendanceMonthsQuery";
import { buildAttendanceTab } from "@/features/stats/utils/attendanceRows.utils";
import { buildTrend, trendMonths } from "@/features/stats/utils/trend.utils";
import {
  ADMIN_STATS_TABS,
  MONTH_LENGTH,
} from "@/screens/adminStats/consts/adminStats.const";
import {
  attendanceValues,
  percentLabel,
  workValues,
} from "@/screens/adminStats/utils/chartValues.utils";

export type AdminStatsTab = (typeof ADMIN_STATS_TABS)[number];

export type AdminStatsListState =
  "loading" | "failed" | "empty" | "work" | "attendance";

export type AdminStatsTrendPoint = {
  month: number;
  value: number | null;
};

export type AdminStatsScreenController = {
  tab: AdminStatsTab;
  month: string;
  selectedMonth: number;
  points: AdminStatsTrendPoint[];
  trendValueLabel: string | undefined;
  listState: AdminStatsListState;
  emptyTotal: string | null;
  openPerson: string | null;
  chooseTab: (value: string) => void;
  pickPerson: (profileId: string) => void;
  goBack: () => void;
  goPrev: () => void;
  goNext: () => void;
  closeSheet: () => void;
  retry: () => void;
};

const NO_MONTHS: string[] = [];

const RETRY_KEYS = [queryKeys.schedule.all, queryKeys.attendance.all];

const EMPTY_TALLY = { present: 0, late: 0, absent: 0, excused: 0 };

function tabOf(value: string): AdminStatsTab {
  return ADMIN_STATS_TABS.find((tab) => tab === value) ?? ADMIN_STATS_TABS[0];
}

export function useAdminStatsScreen(): AdminStatsScreenController {
  const queryClient = useQueryClient();
  const router = useRouter();
  const today = kstToday();

  const [tab, setTab] = useState<AdminStatsTab>(ADMIN_STATS_TABS[0]);
  const { month, goPrev, goNext } = useMonthCursor(monthOf(today));
  const [openPerson, setOpenPerson] = useState<string | null>(null);

  const serverNowMs = useServerNow();
  const months = useMemo(() => trendMonths(month), [month]);

  const work = useWorkMonthsQuery(
    supabase,
    tab === "work" ? months : NO_MONTHS,
  );
  const attendance = useAttendanceMonthsQuery(
    supabase,
    tab === "attendance" ? months : NO_MONTHS,
  );

  const totals = useMemo(() => {
    const inputs = workInputsOf(monthIn(work.data, month)?.days ?? []);

    return computeWorkTotals(inputs.assignments, inputs.days);
  }, [work.data, month]);

  const attendanceByMonth = useMemo(() => {
    const now = new Date(serverNowMs).toISOString();

    return new Map(
      (attendance.data ?? []).map((one) => [
        one.month,
        buildAttendanceTab(
          one.days,
          one.attendance.checkIns,
          one.attendance.excuseStatuses,
          now,
        ),
      ]),
    );
  }, [attendance.data, serverNowMs]);

  const attendanceTab = attendanceByMonth.get(month) ?? {
    tally: EMPTY_TALLY,
    rows: [],
  };

  const points = useMemo(
    () =>
      buildTrend(
        months,
        tab === "work"
          ? workValues(work.data)
          : attendanceValues(attendance.data, attendanceByMonth),
      ).map((point) => ({
        month: Number(point.month.slice(5, MONTH_LENGTH)),
        value: point.value,
      })),
    [months, tab, work.data, attendance.data, attendanceByMonth],
  );

  const active = tab === "work" ? work : attendance;
  const empty =
    tab === "work" ? totals.totalCount === 0 : attendanceTab.rows.length === 0;

  const listState: AdminStatsListState = active.isLoading
    ? "loading"
    : active.error !== null
      ? "failed"
      : empty
        ? "empty"
        : tab;

  return {
    tab,
    month,
    selectedMonth: Number(month.slice(5, MONTH_LENGTH)),
    points,
    trendValueLabel:
      listState === "loading" || listState === "failed" || listState === "empty"
        ? undefined
        : tab === "work"
          ? hoursLabel(totals.totalMinutes)
          : percentLabel(attendanceTab),
    listState,
    emptyTotal: tab === "work" ? NO_VALUE : null,
    openPerson,
    chooseTab: (value) => setTab(tabOf(value)),
    pickPerson: (profileId) => setOpenPerson(profileId),
    goBack: () => router.back(),
    goPrev,
    goNext,
    closeSheet: () => setOpenPerson(null),
    retry: () => {
      for (const queryKey of RETRY_KEYS) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  };
}
