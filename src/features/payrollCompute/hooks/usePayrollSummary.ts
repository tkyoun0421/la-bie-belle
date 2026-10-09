import { supabase } from "@/shared/api/supabase";
import { PAYROLL_VIEW_COPY } from "@/features/payrollCompute/consts/payrollCompute.const";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";
import {
  fragmentStateOf,
  type PayrollFragmentState,
} from "@/features/payrollCompute/model/fragmentState.policy";
import { useMyPayrollViewDaysQuery } from "@/features/payrollCompute/services/useMyPayrollViewDaysQuery";
import { summarizeAmount } from "@/features/payrollCompute/utils/summary.utils";

export type PayrollSummaryController = {
  state: PayrollFragmentState;
  amountLabel: string;
  estimateNote: string;
  retry: () => void;
};

export function usePayrollSummary(span: DateSpan): PayrollSummaryController {
  const read = useMyPayrollViewDaysQuery(supabase, span);

  return {
    state: fragmentStateOf(read),
    amountLabel: summarizeAmount(read.data ?? []),
    estimateNote: PAYROLL_VIEW_COPY.estimateNote,
    retry: read.refetch,
  };
}
