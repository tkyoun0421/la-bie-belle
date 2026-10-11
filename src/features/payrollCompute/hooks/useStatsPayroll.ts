import { supabase } from "@/shared/api/supabase";
import { fragmentOf } from "@/shared/model/fragmentState.policy";
import { spellWon } from "@/shared/utils/spellNumber";
import { PAYROLL_VIEW_COPY } from "@/features/payrollCompute/consts/payrollCompute.const";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";
import { useMyPayrollViewDaysQuery } from "@/features/payrollCompute/services/useMyPayrollViewDaysQuery";
import { myPayrollSubtitle } from "@/features/payrollCompute/utils/payrollSummary.utils";
import { amountTotal } from "@/features/payrollCompute/utils/payrollTotal.utils";

export type StatsPayrollController =
  | { state: "pending" }
  | { state: "failed"; retry: () => void }
  | {
      state: "ready";
      amountLabel: string;
      estimateNote: string;
      subtitle: string;
    };

export function useStatsPayroll(span: DateSpan): StatsPayrollController {
  const read = useMyPayrollViewDaysQuery(supabase, span);

  return fragmentOf(read, {
    failed: () => ({ retry: read.refetch }),
    ready: (days) => ({
      amountLabel: spellWon(amountTotal(days)),
      estimateNote: PAYROLL_VIEW_COPY.estimateNote,
      subtitle: myPayrollSubtitle(days),
    }),
  });
}
