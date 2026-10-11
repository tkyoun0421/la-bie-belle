import { supabase } from "@/shared/api/supabase";
import { fragmentOf } from "@/shared/model/fragmentState.policy";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";
import { useMyPayrollViewDaysQuery } from "@/features/payrollCompute/services/useMyPayrollViewDaysQuery";
import {
  payrollHistoryRows,
  type PayrollHistoryRow,
} from "@/features/payrollCompute/utils/historyRows.utils";

export type PayrollHistoryRowsController =
  | { state: "pending" }
  | { state: "failed"; retry: () => void }
  | { state: "empty" }
  | { state: "ready"; rows: PayrollHistoryRow[] };

export function usePayrollHistoryRows(
  span: DateSpan,
): PayrollHistoryRowsController {
  const read = useMyPayrollViewDaysQuery(supabase, span);

  return fragmentOf(read, {
    empty: (days) => payrollHistoryRows(days).length === 0,
    failed: () => ({ retry: read.refetch }),
    ready: (days) => ({ rows: payrollHistoryRows(days) }),
  });
}
