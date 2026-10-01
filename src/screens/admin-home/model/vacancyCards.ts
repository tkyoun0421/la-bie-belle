import { kstDateOf, spellDate } from "@/screens/admin-home/model/todayStatus";

/**
 * 관리자 홈의 빈 자리 카드다 — 예식이 사흘 안인데 자리가 비어 있는 날마다 한 장이고 없으면
 * 이 자리가 통째로 없다(`docs/2-design/system/screens/admin-home.md`의 「빈 자리 카드」).
 *
 * **사흘이 기준인 것은 NTF-013과 같다.** 푸시가 예식 3일 전 저녁 9시에 한 번 가고 이 카드는
 * 그 뒤로 채워질 때까지 화면에 남는다 — 푸시는 한 번이고 카드는 상태다.
 *
 * **지난 날은 안 센다.** 남은 날이 음수인 날은 재촉할 것이 없다.
 *
 * 오늘은 `now`에서 KST로 옮겨 센다 — 그 손은 [오늘 현황](today-status.ts)이 쥔다.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const WITHIN_DAYS = 3;

export type VacancyDay = {
  workDate: string;
  vacancyCount: number;
};

export type VacancyCard = VacancyDay & { daysLeft: number };

export type VacancyCardsInput = {
  days: readonly VacancyDay[];
  now: string;
};

function daysUntil(workDate: string, today: string): number {
  return Math.round(
    (Date.parse(`${workDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) /
      DAY_MS,
  );
}

/** 빈 자리 목록을 날짜마다 한 줄로 접는다 — 카드가 날짜 단위다. */
export function vacancyDaysOf(
  slots: readonly { work_date: string }[],
): VacancyDay[] {
  const countByDate = new Map<string, number>();

  for (const slot of slots) {
    countByDate.set(slot.work_date, (countByDate.get(slot.work_date) ?? 0) + 1);
  }

  return [...countByDate].map(([workDate, vacancyCount]) => ({
    workDate,
    vacancyCount,
  }));
}

export function vacancyCards({ days, now }: VacancyCardsInput): VacancyCard[] {
  const today = kstDateOf(now);

  return days
    .map((day) => ({ ...day, daysLeft: daysUntil(day.workDate, today) }))
    .filter(
      (card) =>
        card.vacancyCount > 0 &&
        card.daysLeft >= 0 &&
        card.daysLeft <= WITHIN_DAYS,
    )
    .sort((one, other) => one.workDate.localeCompare(other.workDate));
}

/** 카드 아래 줄이다 — 당일이면 남은 날을 안 센다. */
export function vacancyDaysLeftLine(daysLeft: number): string {
  return daysLeft === 0 ? "오늘이에요" : `${daysLeft}일 남았어요`;
}

/** 카드 제목이다 — 「10월 10일(토) 예식에 빈 자리 1」. */
export function vacancyCardTitle({ workDate, vacancyCount }: VacancyDay) {
  return `${spellDate(workDate)} 예식에 빈 자리 ${vacancyCount}`;
}
