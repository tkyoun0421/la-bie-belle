import { spellDuration } from "@/shared/utils/spellNumber";
import type { PayrollDayKind } from "@/entities/payroll/model/payroll.type";
import { ABSENT } from "@/features/payrollCompute/consts/payrollCompute.const";

export type MyPayrollDay = {
  minutes: number;
  kind: PayrollDayKind;
};

export function myPayrollSubtitle(days: readonly MyPayrollDay[]): string {
  const worked = days.filter((day) => day.kind !== ABSENT);
  const minutes = worked.reduce((sum, day) => sum + day.minutes, 0);

  return `근무 ${worked.length}건 · ${spellDuration(minutes)}`;
}
