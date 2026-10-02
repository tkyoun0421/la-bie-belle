import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { kstToday } from "@/shared/lib/kstToday.lib";
import { kstDateOf } from "@/shared/utils/kstDate";
import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { serverClockStore } from "@/entities/clock/stores/clock.store";
import { useUnreadCountQuery } from "@/entities/notification/services/useUnreadCountQuery";
import { usePayrollMonthsQuery } from "@/entities/payroll/services/usePayrollMonthsQuery";
import { useMyProfileRowQuery } from "@/entities/profile/services/useMyProfileRowQuery";
import { useRehearsalMonthsQuery } from "@/entities/rehearsal/services/useRehearsalMonthsQuery";
import { useScheduleMonthsQuery } from "@/entities/schedule/services/useScheduleMonthsQuery";
import { useSessionUserQuery } from "@/entities/session/services/useSessionUserQuery";
import { payrollViewDays } from "@/features/payrollCompute/model/payrollDays.policy";
import {
  canGoToNextPeriod,
  canGoToPreviousPeriod,
} from "@/screens/payroll/model/boundary.policy";
import {
  isInPeriod,
  periodLabel,
  periodMonthKeys,
  periodOf,
  periodStartDate,
  periodUnitOf,
  shiftPeriod,
  type PeriodUnit,
} from "@/screens/payroll/model/period.policy";
import {
  payrollHistoryRows,
  type PayrollHistoryRow,
} from "@/screens/payroll/utils/historyRows.utils";
import {
  summarizeAccrual,
  summarizeAmount,
  type PayrollAccrual,
} from "@/screens/payroll/utils/summary.utils";
import {
  monthRowsOfDays,
  yearRows,
  type PayrollYearRow,
} from "@/screens/payroll/utils/yearRows.utils";

/**
 * 근무자가 자기 급여를 미리 보는 화면의 controller다. 정본은
 * `docs/2-design/modules/payroll/screens/payroll.md`고 완료 조건은
 * `docs/2-design/spec/payroll-view.md`다.
 *
 * **기간이 날짜 하나와 단위 둘로 산다.** 세그먼트가 단위를 고르고 화살표가 그 단위 안에서
 * 날짜를 옮긴다 — 둘을 한 상태로 합치면 「주」로 갔다 「월」로 돌아올 때 보던 달을 잃는다.
 *
 * **고른 단위가 읽는 달을 바꾼다.** 기간이 걸치는 달이 그대로 질의 키라, 단위는 화면 꾸밈이
 * 아니라 통신을 움직이는 값이다 — 그래서 `.tsx`에 안 남는다.
 *
 * **금액을 여기서 안 낸다.** 세 키(`['payroll']`·`['schedule']`·`['rehearsal']`)가 낸 행을
 * `payrollViewDays`에 통째로 넘기고 받는 것은 날 목록 하나다. 그 목록을 기간으로 잘라 문구로
 * 바꾸는 것도 `screens/payroll`의 `model`과 `utils`가 한다.
 *
 * **서버 시계를 쓴다.** 금액 판정이 「지금」을 보는데 기기 시계가 하루 밀린 기기에서는 서버가
 * 셀 것과 다른 카드가 선다.
 *
 * **보낼 데는 안 든다.** 퇴사한 사람의 뒤로와 종 아이콘의 이동은 `.tsx`가 쥔다 — 이 자리가
 * 내는 것은 「퇴사했나」와 「안 읽은 것이 있나」 둘이다.
 */

export type PayrollListState =
  "loading" | "failed" | "empty" | "history" | "months";

export type PayrollScreenController = {
  unit: PeriodUnit;
  periodLabel: string;
  amountLabel: string;
  accrual: PayrollAccrual;
  listState: PayrollListState;
  historyRows: PayrollHistoryRow[];
  monthRows: PayrollYearRow[];
  canGoPrev: boolean;
  canGoNext: boolean;
  unread: boolean;
  hasLeft: boolean;
  loading: boolean;
  chooseUnit: (value: string) => void;
  goPrev: () => void;
  goNext: () => void;
  openMonth: (month: string) => void;
  retry: () => void;
};

/** 다시 시도가 다시 읽는 세 키다 — 금액이 이 셋에서 나온다. */
const RETRY_KEYS = [
  queryKeys.payroll.all,
  queryKeys.schedule.all,
  queryKeys.rehearsal.all,
];

export function usePayrollScreen(client: DB): PayrollScreenController {
  const queryClient = useQueryClient();
  const today = kstToday();

  const [unit, setUnit] = useState<PeriodUnit>("month");
  const [anchorDate, setAnchorDate] = useState(today);

  const { data: me } = useSessionUserQuery(client);
  const { data: profile, isLoading: profileLoading } = useMyProfileRowQuery(
    client,
    me?.id ?? null,
  );
  const unreadCount = useUnreadCountQuery(client);
  const clockOffset = serverClockStore((at) => at.offset);

  const period = useMemo(() => periodOf(anchorDate, unit), [anchorDate, unit]);
  const months = useMemo(() => periodMonthKeys(period), [period]);

  const payroll = usePayrollMonthsQuery(client, months);
  const schedule = useScheduleMonthsQuery(client, months);
  const rehearsal = useRehearsalMonthsQuery(client, months);

  const profileId = profile?.id ?? null;

  const days = useMemo(() => {
    if (
      profileId === null ||
      payroll.data === undefined ||
      schedule.data === undefined ||
      rehearsal.data === undefined
    ) {
      return [];
    }

    return payrollViewDays({
      profileId,
      days: schedule.data,
      rates: payroll.data.wageRates,
      adjustments: payroll.data.adjustments,
      excuses: payroll.data.excuseStatus,
      rehearsals: rehearsal.data,
      now: new Date(nowWithOffset(Date.now(), clockOffset)).toISOString(),
    });
  }, [profileId, payroll.data, schedule.data, rehearsal.data, clockOffset]);

  const shown = useMemo(
    () => days.filter((day) => isInPeriod(period, day.date)),
    [days, period],
  );

  const loading =
    profileLoading ||
    payroll.isLoading ||
    schedule.isLoading ||
    rehearsal.isLoading;

  const failed =
    payroll.error !== null ||
    schedule.error !== null ||
    rehearsal.error !== null;

  const approvedDate =
    profile?.approved_at == null ? null : kstDateOf(profile.approved_at);
  const leftDate = profile?.left_at == null ? null : kstDateOf(profile.left_at);
  const hasLeft = leftDate !== null;

  const listState: PayrollListState = loading
    ? "loading"
    : failed
      ? "failed"
      : shown.length === 0
        ? "empty"
        : unit === "year"
          ? "months"
          : "history";

  return {
    unit,
    periodLabel: periodLabel(period),
    amountLabel: summarizeAmount(shown),
    accrual: summarizeAccrual(shown),
    listState,
    historyRows: payrollHistoryRows(shown),
    monthRows: yearRows(monthRowsOfDays(shown)),
    canGoPrev:
      approvedDate !== null && canGoToPreviousPeriod(period, approvedDate),
    canGoNext: canGoToNextPeriod(period, { today, leftAt: leftDate }),
    unread: !hasLeft && (unreadCount.data ?? 0) > 0,
    hasLeft,
    loading,
    chooseUnit: (value) => setUnit(periodUnitOf(value)),
    goPrev: () => setAnchorDate(periodStartDate(shiftPeriod(period, -1))),
    goNext: () => setAnchorDate(periodStartDate(shiftPeriod(period, 1))),
    openMonth: (month) => {
      setUnit("month");
      setAnchorDate(`${month}-01`);
    },
    retry: () => {
      for (const queryKey of RETRY_KEYS) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  };
}
