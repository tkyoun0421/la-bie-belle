import { supabase } from "@/shared/api/supabase";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";
import {
  fragmentStateOf,
  type PayrollFragmentState,
} from "@/features/payrollCompute/model/fragmentState.policy";
import { useMyPayrollViewDaysQuery } from "@/features/payrollCompute/services/useMyPayrollViewDaysQuery";
import { summarizeAccrual } from "@/features/payrollCompute/utils/summary.utils";

export type PayrollAccrualController = {
  state: PayrollFragmentState;
  work: string;
  late: string | null;
};

export function usePayrollAccrual(span: DateSpan): PayrollAccrualController {
  const read = useMyPayrollViewDaysQuery(supabase, span);

  return { state: fragmentStateOf(read), ...summarizeAccrual(read.data ?? []) };
}
