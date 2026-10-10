import { supabase } from "@/shared/api/supabase";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";
import { fragmentStateOf } from "@/features/payrollCompute/model/fragmentState.policy";
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
  const state = fragmentStateOf(read);

  if (state === "pending") {
    return { state };
  }

  if (state === "failed") {
    return { state, retry: read.refetch };
  }

  const rows = payrollHistoryRows(read.data ?? []);

  return rows.length === 0 ? { state: "empty" } : { state, rows };
}
