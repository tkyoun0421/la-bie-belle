import { supabase } from "@/shared/api/supabase";
import { fragmentOf } from "@/shared/model/fragmentState.policy";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";
import { useMyPayrollViewDaysQuery } from "@/features/payrollCompute/services/useMyPayrollViewDaysQuery";
import { summarizeAccrual } from "@/features/payrollCompute/utils/summary.utils";

export type PayrollAccrualController =
  | { state: "pending" }
  | { state: "failed" }
  | { state: "ready"; work: string; late: string | null };

export function usePayrollAccrual(span: DateSpan): PayrollAccrualController {
  const read = useMyPayrollViewDaysQuery(supabase, span);

  return fragmentOf(read, { ready: (days) => summarizeAccrual(days) });
}
