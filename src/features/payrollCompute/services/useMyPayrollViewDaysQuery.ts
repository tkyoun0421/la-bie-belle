import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { serverNowIso } from "@/entities/clock/model/serverClock.policy";
import { usePayrollMonthsQuery } from "@/entities/payroll/services/usePayrollMonthsQuery";
import { useRehearsalMonthsQuery } from "@/entities/rehearsal/services/useRehearsalMonthsQuery";
import { useScheduleMonthsQuery } from "@/entities/schedule/services/useScheduleMonthsQuery";
import {
  isInSpan,
  monthKeysOf,
  type DateSpan,
} from "@/features/payrollCompute/model/dateSpan.policy";
import {
  payrollViewDays,
  type PayrollViewDay,
} from "@/features/payrollCompute/model/payrollDays.policy";

export type PayrollViewDaysResult = {
  data: PayrollViewDay[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

const STALE_KEYS = [
  queryKeys.payroll.all,
  queryKeys.schedule.all,
  queryKeys.rehearsal.all,
];

export function useMyPayrollViewDaysQuery(
  client: DB,
  span: DateSpan,
  nowMs: number,
  profileId: string | null,
): PayrollViewDaysResult {
  const queryClient = useQueryClient();
  const { from, to } = span;

  const months = useMemo(() => monthKeysOf({ from, to }), [from, to]);

  const payroll = usePayrollMonthsQuery(client, months);
  const schedule = useScheduleMonthsQuery(client, months);
  const rehearsal = useRehearsalMonthsQuery(client, months);

  const data = useMemo(() => {
    if (
      profileId === null ||
      payroll.data === undefined ||
      schedule.data === undefined ||
      rehearsal.data === undefined
    ) {
      return undefined;
    }

    return payrollViewDays({
      profileId,
      days: schedule.data,
      rates: payroll.data.wageRates,
      adjustments: payroll.data.adjustments,
      excuses: payroll.data.excuseStatus,
      rehearsals: rehearsal.data,
      now: serverNowIso(nowMs),
    }).filter((day) => isInSpan({ from, to }, day.date));
  }, [profileId, payroll.data, schedule.data, rehearsal.data, nowMs, from, to]);

  const refetch = useCallback(() => {
    for (const queryKey of STALE_KEYS) {
      void queryClient.invalidateQueries({ queryKey });
    }
  }, [queryClient]);

  return {
    data,
    isLoading: payroll.isLoading || schedule.isLoading || rehearsal.isLoading,
    error: payroll.error ?? schedule.error ?? rehearsal.error,
    refetch,
  };
}
