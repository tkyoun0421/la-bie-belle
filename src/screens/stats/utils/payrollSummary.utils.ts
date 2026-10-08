import type { PayrollDayKind } from "@/features/payrollCompute/model/payrollDays.policy";
import { ABSENT } from "@/screens/stats/consts/stats.const";

const MINUTES_PER_HOUR = 60;

export type MyPayrollDay = {
  minutes: number;
  kind: PayrollDayKind;
};

export function myPayrollSubtitle(days: readonly MyPayrollDay[]): string {
  const worked = days.filter((day) => day.kind !== ABSENT);
  const minutes = worked.reduce((sum, day) => sum + day.minutes, 0);

  return `근무 ${worked.length}건 · ${spellWorkedHours(minutes)}`;
}

function spellWorkedHours(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;

  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}
