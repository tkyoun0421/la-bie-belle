import { supabase } from "@/shared/api/supabase";
import { PAYROLL_VIEW_COPY } from "@/features/payrollCompute/consts/payrollCompute.const";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";
import {
  fragmentStateOf,
  type PayrollFragmentState,
} from "@/features/payrollCompute/model/fragmentState.policy";
import { usePayrollViewDaysQuery } from "@/features/payrollCompute/services/usePayrollViewDaysQuery";
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

export type PayrollMonthRowsController = {
  state: PayrollFragmentState;
  rows: PayrollMonthLine[];
  retry: () => void;
};

export type PayrollMonthRowsSource = {
  span: DateSpan;
  onOpenMonth: (month: string) => void;
};

export function usePayrollMonthRows({
  span,
  onOpenMonth,
}: PayrollMonthRowsSource): PayrollMonthRowsController {
  const read = usePayrollViewDaysQuery(supabase, span);

  return {
    state: fragmentStateOf(read),
    rows: (read.data === undefined
      ? []
      : yearRows(monthRowsOfDays(read.data))
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
    ),
    retry: read.refetch,
  };
}
