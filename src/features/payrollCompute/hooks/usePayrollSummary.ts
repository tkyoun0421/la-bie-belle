import { supabase } from "@/shared/api/supabase";
import { fragmentOf } from "@/shared/model/fragmentState.policy";
import { PAYROLL_VIEW_COPY } from "@/features/payrollCompute/consts/payrollCompute.const";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";
import { useMyPayrollViewDaysQuery } from "@/features/payrollCompute/services/useMyPayrollViewDaysQuery";
import { summarizeAmount } from "@/features/payrollCompute/utils/summary.utils";

export type PayrollSummaryController =
  | { state: "pending" }
  | { state: "failed"; retry: () => void }
  | { state: "ready"; amountLabel: string; estimateNote: string };

export function usePayrollSummary(span: DateSpan): PayrollSummaryController {
  const read = useMyPayrollViewDaysQuery(supabase, span);

  return fragmentOf(read, {
    failed: () => ({ retry: read.refetch }),
    ready: (days) => ({
      amountLabel: summarizeAmount(days),
      estimateNote: PAYROLL_VIEW_COPY.estimateNote,
    }),
  });
}
