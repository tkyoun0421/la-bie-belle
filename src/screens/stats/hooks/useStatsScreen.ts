import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { kstToday } from "@/shared/lib/kstToday.lib";
import { monthOf, shiftMonth, spellMonth } from "@/shared/utils/kstDate";
import {
  canGoToNextMonth,
  canGoToPreviousMonth,
} from "@/shared/utils/monthBoundary";
import { monthIn } from "@/shared/utils/monthIn";
import { spellWon } from "@/shared/utils/spellNumber";
import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { serverClockStore } from "@/entities/clock/stores/clock.store";
import { usePayrollMonthsByMonthQuery } from "@/entities/payroll/services/usePayrollMonthsByMonthQuery";
import { useMyProfileQuery } from "@/entities/profile/services/useMyProfileQuery";
import { useRehearsalMonthsQuery } from "@/entities/rehearsal/services/useRehearsalMonthsQuery";
import { useFirstScheduleMonthQuery } from "@/entities/schedule/services/useFirstScheduleMonthQuery";
import { useWorkMonthsQuery } from "@/entities/schedule/services/useWorkMonthsQuery";
import { useSessionUserQuery } from "@/entities/session/services/useSessionUserQuery";
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
import { myPayrollSubtitle } from "@/screens/stats/utils/payrollSummary.utils";

/**
 * 근무자가 자기 한 달을 숫자로 보는 화면의 controller다. 정본은
 * `docs/2-design/system/screens/stats.md`의 근무자 몫이고 완료 조건은
 * `docs/2-design/spec/stats-worker.md`다.
 *
 * **고른 탭이 읽는 것을 바꾼다.** 탭에 없는 쪽은 열두 달을 안 읽어서, 탭은 화면 꾸밈이
 * 아니라 통신을 움직이는 값이다 — 그래서 `.tsx`에 안 남는다.
 *
 * **보던 달이 탭을 건너 산다.** 달과 탭이 따로 있어 탭을 오가도 달이 그대로다.
 *
 * **「지금」을 서버 시계에서 읽는다.** 근태 판정과 급여 판정이 둘 다 지금에 달려 있어,
 * 기기 시계가 하루 밀린 기기에서는 서버가 셀 것과 다른 숫자가 선다.
 *
 * **금액도 셈도 여기서 안 낸다.** 질의 넷이 낸 행을 `features/stats`와 이 슬라이스의
 * `utils`에 넘기고 받는 것은 그릴 값이다.
 *
 * **보낼 데는 안 든다.** 뒤로와 급여 내역으로 가는 길은 `.tsx`가 쥔다.
 */

export type StatsTab = (typeof STATS_TABS)[number];

export type StatsListState =
  "loading" | "failed" | "empty" | "attendance" | "position" | "payroll";

/** 목록 한 줄이다 — 근태와 포지션이 같은 꼴을 쓴다. */
export type StatsRow = {
  key: string;
  title: string;
  detail: string;
  value: string;
  /** 포지션 줄의 띠 길이다. 근태 줄에는 띠가 없어 0이다. */
  weight: number;
};

export type StatsTrendPoint = {
  month: number;
  value: number | null;
};

export type StatsScreenController = {
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
  amountLabel: string;
  estimateNote: string;
  payrollSubtitle: string;
  chooseTab: (value: string) => void;
  goPrev: () => void;
  goNext: () => void;
  retry: () => void;
};

/**
 * 탭에 없는 쪽은 열두 달을 안 읽는다. 배열을 그때그때 만들면 질의가 매 렌더 새로 선다.
 */
const NO_MONTHS: string[] = [];

/** 다시 시도가 다시 읽는 네 키다 — 세 탭의 숫자가 이 넷에서 나온다. */
const RETRY_KEYS = [
  queryKeys.schedule.all,
  queryKeys.attendance.all,
  queryKeys.payroll.all,
  queryKeys.rehearsal.all,
];

function tabOf(value: string): StatsTab {
  return STATS_TABS.find((tab) => tab === value) ?? STATS_TABS[0];
}

export function useStatsScreen(client: DB): StatsScreenController {
  const queryClient = useQueryClient();
  const today = kstToday();

  const [tab, setTab] = useState<StatsTab>(STATS_TABS[0]);
  const [month, setMonth] = useState(() => monthOf(today));

  const { data: me } = useSessionUserQuery(client);
  const { data: profile, isLoading: profileLoading } = useMyProfileQuery(
    client,
    me?.id ?? null,
  );
  const clockOffset = serverClockStore((at) => at.offset);

  const months = useMemo(() => trendMonths(month), [month]);
  const now = new Date(nowWithOffset(Date.now(), clockOffset)).toISOString();
  const profileId = profile?.id ?? null;

  const work = useWorkMonthsQuery(
    client,
    tab === "attendance" ? NO_MONTHS : months,
  );
  const attendance = useAttendanceMonthsQuery(
    client,
    tab === "attendance" ? months : NO_MONTHS,
  );
  const payroll = usePayrollMonthsByMonthQuery(
    client,
    tab === "payroll" ? months : NO_MONTHS,
  );
  const rehearsal = useRehearsalMonthsQuery(
    client,
    tab === "payroll" ? months : NO_MONTHS,
  );
  const firstMonth = useFirstScheduleMonthQuery(client);

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
    amountLabel: spellWon(payrollTotal),
    estimateNote: STATS_COPY.estimateNote,
    payrollSubtitle: myPayrollSubtitle(payrollDays),
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
