import { type MemberWageRate } from "@/entities/payroll/model/payroll.type";
import { latestWageRate } from "@/entities/payroll/model/wageRows.policy";

export function canResetToDefault(
  wageRates: readonly MemberWageRate[],
  hasDefaultWage: boolean,
): boolean {
  return hasDefaultWage && latestWageRate(wageRates)?.followsDefault === false;
}
