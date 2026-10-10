import { supabase } from "@/shared/api/supabase";
import { PAYROLL_VIEW_COPY } from "@/features/payrollCompute/consts/payrollCompute.const";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";
import { fragmentStateOf } from "@/features/payrollCompute/model/fragmentState.policy";
import { useMyPayrollViewDaysQuery } from "@/features/payrollCompute/services/useMyPayrollViewDaysQuery";
import { summarizeAmount } from "@/features/payrollCompute/utils/summary.utils";

export type PayrollSummaryController =
  | { state: "pending" }
  | { state: "failed"; retry: () => void }
  | { state: "ready"; amountLabel: string; estimateNote: string };

export function usePayrollSummary(span: DateSpan): PayrollSummaryController {
  const read = useMyPayrollViewDaysQuery(supabase, span);
  const state = fragmentStateOf(read);

  if (state === "pending") {
    return { state };
  }

  if (state === "failed") {
    return { state, retry: read.refetch };
  }

  return {
    state,
    amountLabel: summarizeAmount(read.data ?? []),
    estimateNote: PAYROLL_VIEW_COPY.estimateNote,
  };
}
