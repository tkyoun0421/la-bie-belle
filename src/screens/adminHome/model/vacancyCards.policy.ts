import { daysUntil, kstDateOf, spellDate } from "@/shared/utils/kstDate";
import type { OpenSlot } from "@/entities/schedule/model/schedule.type";
import { countOpenSlotsByDate } from "@/entities/schedule/utils/groupOpenSlots.utils";
import { WITHIN_DAYS } from "@/screens/adminHome/consts/adminHome.const";

export type VacancyDay = {
  workDate: string;
  vacancyCount: number;
};

export type VacancyCard = VacancyDay & { daysLeft: number };

export type VacancyCardsInput = {
  days: readonly VacancyDay[];
  now: string;
};

export function vacancyDaysOf(
  slots: readonly Pick<OpenSlot, "workDate">[],
): VacancyDay[] {
  return Object.entries(countOpenSlotsByDate(slots)).map(
    ([workDate, vacancyCount]) => ({ workDate, vacancyCount }),
  );
}

export function vacancyCards({ days, now }: VacancyCardsInput): VacancyCard[] {
  const today = kstDateOf(now);

  return days
    .map((day) => ({ ...day, daysLeft: daysUntil(today, day.workDate) }))
    .filter(
      (card) =>
        card.vacancyCount > 0 &&
        card.daysLeft >= 0 &&
        card.daysLeft <= WITHIN_DAYS,
    )
    .sort((one, other) => one.workDate.localeCompare(other.workDate));
}

export function vacancyDaysLeftLine(daysLeft: number): string {
  return daysLeft === 0 ? "오늘이에요" : `${daysLeft}일 남았어요`;
}

export function vacancyCardTitle({ workDate, vacancyCount }: VacancyDay) {
  return `${spellDate(workDate)} 예식에 빈 자리 ${vacancyCount}`;
}
