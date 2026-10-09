import { usePathname, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import {
  LEFT_PATH,
  NOTIFICATIONS_PATH,
} from "@/shared/consts/navigation.const";
import { kstToday } from "@/shared/lib/kstToday.lib";
import { kstDateOf } from "@/shared/utils/kstDate";
import { useUnreadCountQuery } from "@/entities/notification/services/useUnreadCountQuery";
import { useMyProfileRowQuery } from "@/entities/profile/services/useMyProfileRowQuery";
import { useSessionUserQuery } from "@/entities/session/services/useSessionUserQuery";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";
import { usePayrollViewDaysQuery } from "@/features/payrollCompute/services/usePayrollViewDaysQuery";
import {
  canGoToNextPeriod,
  canGoToPreviousPeriod,
} from "@/screens/payroll/model/boundary.policy";
import {
  periodLabel,
  periodOf,
  periodSpan,
  periodStartDate,
  periodUnitOf,
  shiftPeriod,
  type PeriodUnit,
} from "@/screens/payroll/model/period.policy";

export type PayrollListState =
  "loading" | "failed" | "empty" | "history" | "months";

export type PayrollScreenController = {
  goBack: (() => void) | undefined;
  showBell: boolean;
  openNotifications: () => void;
  unit: PeriodUnit;
  periodLabel: string;
  span: DateSpan;
  listState: PayrollListState;
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

export function usePayrollScreen(): PayrollScreenController {
  const router = useRouter();
  const pathname = usePathname();
  const today = kstToday();

  const [unit, setUnit] = useState<PeriodUnit>("month");
  const [anchorDate, setAnchorDate] = useState(today);

  const { data: me } = useSessionUserQuery(supabase);
  const { data: profile, isLoading: profileLoading } = useMyProfileRowQuery(
    supabase,
    me?.id ?? null,
  );
  const unreadCount = useUnreadCountQuery(supabase);

  const period = useMemo(() => periodOf(anchorDate, unit), [anchorDate, unit]);
  const span = useMemo(() => periodSpan(period), [period]);

  const payroll = usePayrollViewDaysQuery(supabase, span);

  const loading = profileLoading || payroll.isLoading;

  const approvedDate =
    profile?.approvedAt == null ? null : kstDateOf(profile.approvedAt);
  const leftDate = profile?.leftAt == null ? null : kstDateOf(profile.leftAt);
  const hasLeft = leftDate !== null;

  const listState: PayrollListState = loading
    ? "loading"
    : payroll.error !== null
      ? "failed"
      : (payroll.data?.length ?? 0) === 0
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
    span,
    listState,
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
    retry: payroll.refetch,
  };
}
