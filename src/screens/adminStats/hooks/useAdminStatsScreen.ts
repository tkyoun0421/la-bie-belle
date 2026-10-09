import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { queryKeys } from "@/shared/api/queryKeys";
import { supabase } from "@/shared/api/supabase";
import { NO_VALUE } from "@/shared/consts/noValue.const";
import { kstToday } from "@/shared/lib/kstToday.lib";
import type { ListRowValueTone } from "@/shared/ui/ListRow";
import {
  monthOf,
  shiftMonth,
  spellDate,
  spellMonth,
} from "@/shared/utils/kstDate";
import {
  canGoToNextMonth,
  canGoToPreviousMonth,
} from "@/shared/utils/monthBoundary";
import { monthIn } from "@/shared/utils/monthIn";
import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { serverClockStore } from "@/entities/clock/stores/clock.store";
import { useFirstScheduleMonthQuery } from "@/entities/schedule/services/useFirstScheduleMonthQuery";
import { useWorkMonthsQuery } from "@/entities/schedule/services/useWorkMonthsQuery";
import {
  computeWorkTotals,
  hoursLabel,
  workInputsOf,
} from "@/features/stats/model/workTotals.policy";
import { useAttendanceMonthsQuery } from "@/features/stats/services/useAttendanceMonthsQuery";
import { computePersonDays } from "@/features/stats/utils/personDays.utils";
import { buildTrend, trendMonths } from "@/features/stats/utils/trend.utils";
import {
  ADMIN_STATS_COPY,
  ADMIN_STATS_TABS,
  MONTH_LENGTH,
} from "@/screens/adminStats/consts/adminStats.const";
import {
  adminAttendanceLine,
  adminAttendanceShares,
  type AdminAttendanceShare,
} from "@/screens/adminStats/utils/attendanceLine.utils";
import {
  attendanceRowValue,
  buildAttendanceTab,
} from "@/screens/adminStats/utils/attendanceRows.utils";
import {
  attendanceValues,
  percentLabel,
  workValues,
} from "@/screens/adminStats/utils/chartValues.utils";

export type AdminStatsTab = (typeof ADMIN_STATS_TABS)[number];

export type AdminStatsListState =
  "loading" | "failed" | "empty" | "work" | "attendance";

export type AdminStatsPersonRow = {
  key: string;
  profileId: string;
  displayName: string;
  detail: string;
  value: string;
  weight: number;
  press: () => void;
};

export type AdminStatsPositionRow = {
  key: string;
  title: string;
  detail: string;
  value: string;
  weight: number;
  valueTone: ListRowValueTone;
};

export type AdminStatsAttendanceRow = {
  key: string;
  displayName: string;
  value: string;
};

export type AdminStatsSheet = {
  name: string;
  rows: { key: string; title: string; value: string }[];
  total: string;
};

export type AdminStatsTrendPoint = {
  month: number;
  value: number | null;
};

export type AdminStatsScreenController = {
  tab: AdminStatsTab;
  month: string;
  monthLabel: string;
  selectedMonth: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  points: AdminStatsTrendPoint[];
  trendValueLabel: string | undefined;
  listState: AdminStatsListState;
  emptyTotal: string | null;
  totalLabel: string;
  countLine: string;
  peopleRows: AdminStatsPersonRow[];
  positionRows: AdminStatsPositionRow[];
  attendanceLine: string;
  shares: AdminAttendanceShare[];
  attendanceRows: AdminStatsAttendanceRow[];
  sheet: AdminStatsSheet | null;
  chooseTab: (value: string) => void;
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
  const [month, setMonth] = useState(() => monthOf(today));
  const [openPerson, setOpenPerson] = useState<string | null>(null);

  const clockOffset = serverClockStore((at) => at.offset);
  const months = useMemo(() => trendMonths(month), [month]);

  const work = useWorkMonthsQuery(
    supabase,
    tab === "work" ? months : NO_MONTHS,
  );
  const attendance = useAttendanceMonthsQuery(
    supabase,
    tab === "attendance" ? months : NO_MONTHS,
  );
  const firstMonth = useFirstScheduleMonthQuery(supabase);

  const workInputs = useMemo(
    () => workInputsOf(monthIn(work.data, month)?.days ?? []),
    [work.data, month],
  );
  const totals = useMemo(
    () => computeWorkTotals(workInputs.assignments, workInputs.days),
    [workInputs],
  );

  const attendanceByMonth = useMemo(() => {
    const now = new Date(nowWithOffset(Date.now(), clockOffset)).toISOString();

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
  }, [attendance.data, clockOffset]);

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

  const personDays =
    openPerson === null
      ? null
      : computePersonDays(openPerson, workInputs.assignments, workInputs.days);

  const totalLabel = hoursLabel(totals.totalMinutes);

  return {
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
        : tab === "work"
          ? totalLabel
          : percentLabel(attendanceTab),
    listState,
    emptyTotal: tab === "work" ? NO_VALUE : null,
    totalLabel,
    countLine: `${ADMIN_STATS_COPY.workCountPrefix}${totals.totalCount}${ADMIN_STATS_COPY.workCountSuffix}`,
    peopleRows: totals.byPerson.map((row) => ({
      key: row.profileId,
      profileId: row.profileId,
      displayName: row.displayName,
      detail: `${row.count}${ADMIN_STATS_COPY.timesSuffix}`,
      value: hoursLabel(row.minutes),
      weight: row.minutes,
      press: () => setOpenPerson(row.profileId),
    })),
    positionRows: totals.byPosition.map((row) => ({
      key: row.position,
      title: row.position,
      detail: `${row.count}${ADMIN_STATS_COPY.countSuffix}`,
      value: hoursLabel(row.minutes),
      weight: row.minutes,
      valueTone: row.minutes === 0 ? "zero" : "answer",
    })),
    attendanceLine: adminAttendanceLine(attendanceTab.tally),
    shares: adminAttendanceShares(attendanceTab.tally),
    attendanceRows: attendanceTab.rows.map((row) => ({
      key: row.profileId,
      displayName: row.displayName,
      value: attendanceRowValue(row),
    })),
    sheet:
      personDays === null
        ? null
        : {
            name:
              totals.byPerson.find((row) => row.profileId === openPerson)
                ?.displayName ?? "",
            rows: personDays.days.map((row) => ({
              key: `${row.workDate}-${row.position}`,
              title: `${spellDate(row.workDate)} · ${row.label}`,
              value: hoursLabel(row.minutes),
            })),
            total: `${ADMIN_STATS_COPY.totalPrefix}${personDays.totalCount}${ADMIN_STATS_COPY.timesSuffix} · ${hoursLabel(personDays.totalMinutes)}`,
          },
    chooseTab: (value) => setTab(tabOf(value)),
    goBack: () => router.back(),
    goPrev: () => setMonth(shiftMonth(month, -1)),
    goNext: () => setMonth(shiftMonth(month, 1)),
    closeSheet: () => setOpenPerson(null),
    retry: () => {
      for (const queryKey of RETRY_KEYS) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  };
}
