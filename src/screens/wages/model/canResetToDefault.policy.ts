import { type MemberWageRateRow } from "@/entities/payroll/api/payroll.dto";
import { latestWageRate } from "@/screens/wages/model/wageRows.policy";

export function canResetToDefault(
  wageRates: readonly MemberWageRateRow[],
  hasDefaultWage: boolean,
): boolean {
  return hasDefaultWage && latestWageRate(wageRates)?.follows_default === false;
}
