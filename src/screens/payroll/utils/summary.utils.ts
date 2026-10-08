import { spellWon } from "@/shared/utils/spellNumber";
import type { AttendanceStatusInput } from "@/entities/attendance/model/attendance.type";
import { getAttendanceStatus } from "@/entities/attendance/model/attendanceStatus.policy";
import type { PayrollDayKind } from "@/features/payrollCompute/model/payrollDays.policy";
import { NO_AMOUNT } from "@/screens/payroll/consts/payroll.const";

const MINUTES_PER_HOUR = 60;

export type PayrollSummaryDay = {
  date: string;
  minutes: number;
  amount: number;
  kind: PayrollDayKind;
  attendance: AttendanceStatusInput | null;
};

export type PayrollAccrual = {
  work: string;
  late: string | null;
};

function spellWorkedHours(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;

  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}

function isLate(day: PayrollSummaryDay): boolean {
  return (
    day.attendance !== null && getAttendanceStatus(day.attendance) === "late"
  );
}

export function summarizeAmount(days: readonly PayrollSummaryDay[]): string {
  if (days.length === 0) {
    return NO_AMOUNT;
  }

  return spellWon(days.reduce((sum, day) => sum + day.amount, 0));
}

export function summarizeAccrual(
  days: readonly PayrollSummaryDay[],
): PayrollAccrual {
  const worked = days.filter((day) => day.kind !== "absent");
  const late = days.filter(isLate).length;
  const minutes = worked.reduce((sum, day) => sum + day.minutes, 0);

  return {
    work: `${worked.length}회 · ${spellWorkedHours(minutes)}`,
    late: late === 0 ? null : `${late}회`,
  };
}
