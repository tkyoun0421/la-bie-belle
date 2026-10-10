import { spellDate } from "@/shared/utils/kstDate";
import { spellDuration, spellWon } from "@/shared/utils/spellNumber";
import type { PayrollDayKind } from "@/entities/payroll/model/payroll.type";
import { NO_AMOUNT } from "@/features/payrollCompute/consts/payrollCompute.const";

const ABSENT_SUBTITLE = "결근";

const WAGE_PENDING_NOTE = "시급 미정";

const SEPARATOR = " · ";

export type PayrollHistoryDay = {
  date: string;
  amount: number;
  kind: PayrollDayKind;
  position: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isEducation: boolean;
  overtimeMinutes: number;
  rehearsalMinutes?: number;
};

export type PayrollHistoryRow = {
  date: string;
  title: string;
  subtitle: string;
  amountLabel: string;
};

function shiftLine(day: PayrollHistoryDay): string {
  if (day.position !== null) {
    const position = day.isEducation ? `${day.position} 교육` : day.position;

    return `${position}${SEPARATOR}${day.startsAt}–${day.endsAt}`;
  }

  const rehearsal = day.rehearsalMinutes ?? 0;

  return rehearsal === 0 ? "" : `리허설 ${spellDuration(rehearsal)}`;
}

function subtitleOf(day: PayrollHistoryDay): string {
  if (day.kind === "absent") {
    return ABSENT_SUBTITLE;
  }

  const notes = [
    shiftLine(day),
    day.overtimeMinutes === 0
      ? ""
      : `연장 ${spellDuration(day.overtimeMinutes)}`,
    day.kind === "wage-pending" ? WAGE_PENDING_NOTE : "",
  ];

  return notes.filter((note) => note !== "").join(SEPARATOR);
}

function amountLabelOf(day: PayrollHistoryDay): string {
  return day.kind === "absent" || day.kind === "wage-pending"
    ? NO_AMOUNT
    : spellWon(day.amount);
}

export function payrollHistoryRows(
  days: readonly PayrollHistoryDay[],
): PayrollHistoryRow[] {
  return [...days]
    .sort((left, right) => (left.date < right.date ? 1 : -1))
    .map((day) => ({
      date: day.date,
      title: spellDate(day.date),
      subtitle: subtitleOf(day),
      amountLabel: amountLabelOf(day),
    }));
}
