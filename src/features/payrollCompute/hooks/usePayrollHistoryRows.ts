import { supabase } from "@/shared/api/supabase";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";
import {
  fragmentStateOf,
  type PayrollFragmentState,
} from "@/features/payrollCompute/model/fragmentState.policy";
import { useMyPayrollViewDaysQuery } from "@/features/payrollCompute/services/useMyPayrollViewDaysQuery";
import {
  payrollHistoryRows,
  type PayrollHistoryRow,
} from "@/features/payrollCompute/utils/historyRows.utils";

export type PayrollHistoryRowsController = {
  state: PayrollFragmentState;
  rows: PayrollHistoryRow[];
  retry: () => void;
};

export function usePayrollHistoryRows(
  span: DateSpan,
): PayrollHistoryRowsController {
  const read = useMyPayrollViewDaysQuery(supabase, span);

  return {
    state: fragmentStateOf(read),
    rows: payrollHistoryRows(read.data ?? []),
    retry: read.refetch,
  };
}
