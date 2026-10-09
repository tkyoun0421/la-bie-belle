import { supabase } from "@/shared/api/supabase";
import { spellWon } from "@/shared/utils/spellNumber";
import { PAYROLL_VIEW_COPY } from "@/features/payrollCompute/consts/payrollCompute.const";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";
import {
  fragmentStateOf,
  type PayrollFragmentState,
} from "@/features/payrollCompute/model/fragmentState.policy";
import { useMyPayrollViewDaysQuery } from "@/features/payrollCompute/services/useMyPayrollViewDaysQuery";
import { myPayrollSubtitle } from "@/features/payrollCompute/utils/payrollSummary.utils";
import { amountTotal } from "@/features/payrollCompute/utils/payrollTotal.utils";

export type StatsPayrollController = {
  state: PayrollFragmentState;
  amountLabel: string;
  estimateNote: string;
  subtitle: string;
  retry: () => void;
};

export function useStatsPayroll(span: DateSpan): StatsPayrollController {
  const read = useMyPayrollViewDaysQuery(supabase, span);
  const days = read.data ?? [];

  return {
    state: fragmentStateOf(read),
    amountLabel: spellWon(amountTotal(days)),
    estimateNote: PAYROLL_VIEW_COPY.estimateNote,
    subtitle: myPayrollSubtitle(days),
    retry: read.refetch,
  };
}
