import { spellDate } from "@/shared/lib/kst-date";
import { spellWon } from "@/shared/lib/spell-number";
import type { PayrollDayKind } from "@/features/payroll/model/payroll-days";
import { NO_AMOUNT } from "@/screens/payroll/model/summary";

/**
 * 내역 목록의 줄이다(`docs/2-design/modules/payroll/screens/payroll.md`의 「내역 목록」).
 * 최근 날이 위고 줄을 눌러도 다음 화면이 없다 — 한 줄이 담는 것이 이미 그날의 전부다.
 *
 * **금액이 안 맞아 보이는 날은 그 까닭이 줄 안에 있다.** 연장이 붙은 날은 시급 곱하기 시간이
 * 안 맞고(PAY-005), 결근한 날과 시급이 아직 없는 날은 금액이 `–`다. 근무자가 검산하다 막히는
 * 자리라 이유를 보조 정보에 붙인다.
 *
 * **금액이 비는 날도 줄은 선다.** 지우면 금액이 왜 적은지, 나온 날이 어디 갔는지를 못 찾는다.
 *
 * **연장 문구는 초과분을 그대로 적는다.** 리허설이 분 단위로 붙어 정각이 아닌 초과분이 실제로
 * 나서 「연장 1시간 30분」과 「연장 30분」이 둘 다 있다.
 */

const MINUTES_PER_HOUR = 60;

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
  /**
   * 배정 없이 리허설만 있는 날의 시간 합이다. 그 날은 설 포지션도 근무 시각도 없어 보조 정보
   * 자리가 이 값으로 선다 — 배정이 있는 날은 리허설 몫이 금액과 연장 문구에 이미 실려 있다.
   */
  rehearsalMinutes?: number;
};

export type PayrollHistoryRow = {
  date: string;
  title: string;
  subtitle: string;
  amountLabel: string;
};

/** 「1시간 30분」·「30분」. 초과분은 0시간을 안 적는다. */
function spellLength(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;

  if (hours === 0) {
    return `${rest}분`;
  }

  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}

function shiftLine(day: PayrollHistoryDay): string {
  if (day.position !== null) {
    const position = day.isEducation ? `${day.position} 교육` : day.position;

    return `${position}${SEPARATOR}${day.startsAt}–${day.endsAt}`;
  }

  const rehearsal = day.rehearsalMinutes ?? 0;

  return rehearsal === 0 ? "" : `리허설 ${spellLength(rehearsal)}`;
}

function subtitleOf(day: PayrollHistoryDay): string {
  if (day.kind === "absent") {
    return ABSENT_SUBTITLE;
  }

  const notes = [
    shiftLine(day),
    day.overtimeMinutes === 0 ? "" : `연장 ${spellLength(day.overtimeMinutes)}`,
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
