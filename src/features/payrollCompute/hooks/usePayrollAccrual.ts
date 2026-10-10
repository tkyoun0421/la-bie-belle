import { supabase } from "@/shared/api/supabase";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";
import { fragmentStateOf } from "@/features/payrollCompute/model/fragmentState.policy";
import { useMyPayrollViewDaysQuery } from "@/features/payrollCompute/services/useMyPayrollViewDaysQuery";
import { summarizeAccrual } from "@/features/payrollCompute/utils/summary.utils";

export type PayrollAccrualController =
  | { state: "pending" }
  | { state: "failed" }
  | { state: "ready"; work: string; late: string | null };

export function usePayrollAccrual(span: DateSpan): PayrollAccrualController {
  const read = useMyPayrollViewDaysQuery(supabase, span);
  const state = fragmentStateOf(read);

  if (state !== "ready") {
    return { state };
  }

  return { state, ...summarizeAccrual(read.data ?? []) };
}
