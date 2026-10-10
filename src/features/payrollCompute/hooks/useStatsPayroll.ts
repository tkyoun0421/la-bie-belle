import { supabase } from "@/shared/api/supabase";
import { spellWon } from "@/shared/utils/spellNumber";
import { PAYROLL_VIEW_COPY } from "@/features/payrollCompute/consts/payrollCompute.const";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";
import { fragmentStateOf } from "@/features/payrollCompute/model/fragmentState.policy";
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
  const state = fragmentStateOf(read);

  if (state === "pending") {
    return { state };
  }

  if (state === "failed") {
    return { state, retry: read.refetch };
  }

  const days = read.data ?? [];

  return {
    state,
    amountLabel: spellWon(amountTotal(days)),
    estimateNote: PAYROLL_VIEW_COPY.estimateNote,
    subtitle: myPayrollSubtitle(days),
  };
}
