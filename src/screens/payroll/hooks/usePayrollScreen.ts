import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { queryKeys } from "@/shared/api/queryKeys";
import { supabase } from "@/shared/api/supabase";
import {
  LEFT_PATH,
  NOTIFICATIONS_PATH,
} from "@/shared/consts/navigation.const";
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

export type PayrollListState =
  "loading" | "failed" | "empty" | "history" | "months";

export type PayrollScreenController = {
  goBack: (() => void) | undefined;
  showBell: boolean;
  openNotifications: () => void;
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

const RETRY_KEYS = [
  queryKeys.payroll.all,
  queryKeys.schedule.all,
  queryKeys.rehearsal.all,
];

export function usePayrollScreen(): PayrollScreenController {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const today = kstToday();

  const [unit, setUnit] = useState<PeriodUnit>("month");
  const [anchorDate, setAnchorDate] = useState(today);

  const { data: me } = useSessionUserQuery(supabase);
  const { data: profile, isLoading: profileLoading } = useMyProfileRowQuery(
    supabase,
    me?.id ?? null,
  );
  const unreadCount = useUnreadCountQuery(supabase);
  const clockOffset = serverClockStore((at) => at.offset);

  const period = useMemo(() => periodOf(anchorDate, unit), [anchorDate, unit]);
  const months = useMemo(() => periodMonthKeys(period), [period]);

  const payroll = usePayrollMonthsQuery(supabase, months);
  const schedule = useScheduleMonthsQuery(supabase, months);
  const rehearsal = useRehearsalMonthsQuery(supabase, months);

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
    profile?.approvedAt == null ? null : kstDateOf(profile.approvedAt);
  const leftDate = profile?.leftAt == null ? null : kstDateOf(profile.leftAt);
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

  const goLeft = useCallback(() => router.replace(LEFT_PATH), [router]);

  const openNotifications = useCallback(
    () => router.push(`${NOTIFICATIONS_PATH}?from=${pathname}`),
    [router, pathname],
  );

  return {
    goBack: hasLeft ? goLeft : undefined,
    showBell: !hasLeft,
    openNotifications,
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
