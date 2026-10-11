import { supabase } from "@/shared/api/supabase";
import { fragmentOf } from "@/shared/model/fragmentState.policy";
import { PAYROLL_VIEW_COPY } from "@/features/payrollCompute/consts/payrollCompute.const";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";
import type { PayrollViewDay } from "@/features/payrollCompute/model/payrollDays.policy";
import { useMyPayrollViewDaysQuery } from "@/features/payrollCompute/services/useMyPayrollViewDaysQuery";
import {
  monthRowsOfDays,
  yearRows,
} from "@/features/payrollCompute/utils/yearRows.utils";

export type PayrollMonthLine = {
  key: string;
  title: string;
  amountLabel: string;
  press: (() => void) | undefined;
};

export type PayrollMonthRowsController =
  | { state: "pending" }
  | { state: "failed"; retry: () => void }
  | { state: "empty" }
  | { state: "ready"; rows: PayrollMonthLine[] };

export type PayrollMonthRowsSource = {
  span: DateSpan;
  onOpenMonth: (month: string) => void;
};

function monthLinesOf(
  days: readonly PayrollViewDay[],
  onOpenMonth: (month: string) => void,
): PayrollMonthLine[] {
  return yearRows(monthRowsOfDays(days)).map((row) =>
    row.type === "month"
      ? {
          key: row.month,
          title: row.title,
          amountLabel: row.amountLabel,
          press: () => onOpenMonth(row.month),
        }
      : {
          key: "total",
          title: PAYROLL_VIEW_COPY.totalTitle,
          amountLabel: row.amountLabel,
          press: undefined,
        },
  );
}

export function usePayrollMonthRows({
  span,
  onOpenMonth,
}: PayrollMonthRowsSource): PayrollMonthRowsController {
  const read = useMyPayrollViewDaysQuery(supabase, span);

  return fragmentOf(read, {
    empty: (days) => yearRows(monthRowsOfDays(days)).length === 0,
    failed: () => ({ retry: read.refetch }),
    ready: (days) => ({ rows: monthLinesOf(days, onOpenMonth) }),
  });
}
