import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { kstToday } from "@/shared/lib/kstToday.lib";
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

/**
 * 관리자가 한 달을 숫자로 보는 화면의 controller다. 정본은
 * `docs/2-design/system/screens/stats.md`의 관리자 몫이고 완료 조건은
 * `docs/2-design/spec/stats-admin.md`다.
 *
 * **금액이 없다.** 이 화면이 세는 것은 시간과 회수와 비율이고 시급을 아예 안 읽는다.
 *
 * **고른 탭이 읽는 것을 바꾼다.** 탭에 없는 쪽은 열두 달을 안 읽어서, 탭은 화면 꾸밈이
 * 아니라 통신을 움직이는 값이다.
 *
 * **시트 열림도 여기 있다.** 누른 사람의 날 목록이 이번 달 근무표에서 갈려 나와서, 달을
 * 옮기면 그 사람의 날이 달라진다 — 열림이 통신 결과에 매여 있으면 화면 것이 아니다.
 *
 * **보낼 데는 안 든다.** 뒤로는 `.tsx`가 쥔다.
 */

export type AdminStatsTab = (typeof ADMIN_STATS_TABS)[number];

export type AdminStatsListState =
  "loading" | "failed" | "empty" | "work" | "attendance";

/** 사람별 구획 한 줄이다 — 누르면 그 사람의 날 목록이 열린다. */
export type AdminStatsPersonRow = {
  key: string;
  profileId: string;
  displayName: string;
  detail: string;
  value: string;
  /** 띠 길이다 — 시간을 그대로 쓴다. */
  weight: number;
  press: () => void;
};

/** 포지션 구획 한 줄이다. 0인 포지션도 자리가 서서 값의 색이 갈린다. */
export type AdminStatsPositionRow = {
  key: string;
  title: string;
  detail: string;
  value: string;
  weight: number;
  isZero: boolean;
};

export type AdminStatsAttendanceRow = {
  key: string;
  displayName: string;
  value: string;
};

/** 근무 내역 시트가 그릴 글자다 — 줄도 합계도 여기서 이미 글월이다. */
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
  totalLabel: string;
  countLine: string;
  peopleRows: AdminStatsPersonRow[];
  positionRows: AdminStatsPositionRow[];
  attendanceLine: string;
  shares: AdminAttendanceShare[];
  attendanceRows: AdminStatsAttendanceRow[];
  sheet: AdminStatsSheet | null;
  chooseTab: (value: string) => void;
  goPrev: () => void;
  goNext: () => void;
  closeSheet: () => void;
  retry: () => void;
};

/** 탭에 없는 쪽은 열두 달을 안 읽는다. 배열을 그때그때 만들면 질의가 매 렌더 새로 선다. */
const NO_MONTHS: string[] = [];

/** 다시 시도가 다시 읽는 두 키다 — 두 탭의 숫자가 이 둘에서 나온다. */
const RETRY_KEYS = [queryKeys.schedule.all, queryKeys.attendance.all];

const EMPTY_TALLY = { present: 0, late: 0, absent: 0, excused: 0 };

function tabOf(value: string): AdminStatsTab {
  return ADMIN_STATS_TABS.find((tab) => tab === value) ?? ADMIN_STATS_TABS[0];
}

export function useAdminStatsScreen(client: DB): AdminStatsScreenController {
  const queryClient = useQueryClient();
  const today = kstToday();

  const [tab, setTab] = useState<AdminStatsTab>(ADMIN_STATS_TABS[0]);
  const [month, setMonth] = useState(() => monthOf(today));
  const [openPerson, setOpenPerson] = useState<string | null>(null);

  const clockOffset = serverClockStore((at) => at.offset);
  const months = useMemo(() => trendMonths(month), [month]);

  const work = useWorkMonthsQuery(client, tab === "work" ? months : NO_MONTHS);
  const attendance = useAttendanceMonthsQuery(
    client,
    tab === "attendance" ? months : NO_MONTHS,
  );
  const firstMonth = useFirstScheduleMonthQuery(client);

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
      isZero: row.minutes === 0,
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
