import { supabase } from "@/shared/api/supabase";
import { PAYROLL_VIEW_COPY } from "@/features/payrollCompute/consts/payrollCompute.const";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";
import { fragmentStateOf } from "@/features/payrollCompute/model/fragmentState.policy";
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

export function usePayrollMonthRows({
  span,
  onOpenMonth,
}: PayrollMonthRowsSource): PayrollMonthRowsController {
  const read = useMyPayrollViewDaysQuery(supabase, span);
  const state = fragmentStateOf(read);

  if (state === "pending") {
    return { state };
  }

  if (state === "failed") {
    return { state, retry: read.refetch };
  }

  const rows: PayrollMonthLine[] = (
    read.data === undefined ? [] : yearRows(monthRowsOfDays(read.data))
  ).map((row) =>
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

  return rows.length === 0 ? { state: "empty" } : { state, rows };
}
