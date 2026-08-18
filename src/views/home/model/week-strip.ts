import { format } from "date-fns";
import { ko } from "date-fns/locale";

import type { WeekDay } from "@/views/home/model/home-view-model";

export type WeekStripCell = {
  date: string;
  weekdayLabel: string;
  dayNumber: number;
  hasShift: boolean;
};

export type WeekFooter = {
  caption: string;
  amount: number | null;
};

export type WeekDayLabel = {
  weekdayLabel: string;
  dayNumber: number;
};

function toDate(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00`);
}

export function toWeekStripCells(days: readonly WeekDay[]): WeekStripCell[] {
  return days.map((day) => {
    const date = toDate(day.date);
    return {
      date: day.date,
      weekdayLabel: format(date, "EEE", { locale: ko }),
      dayNumber: date.getDate(),
      hasShift: day.hasShift,
    };
  });
}

function toWeekSummaryFooter(days: readonly WeekDay[]): WeekFooter {
  const workedDays = days.filter(
    (day): day is WeekDay & { shift: NonNullable<WeekDay["shift"]> } =>
      day.hasShift && Boolean(day.shift),
  );

  if (workedDays.length === 0) {
    return { caption: "이번 주 근무가 없어요", amount: null };
  }

  const totalHours = workedDays.reduce((sum, day) => sum + day.shift.hours, 0);
  const totalAmount = workedDays.reduce((sum, day) => sum + day.shift.amount, 0);

  return {
    caption: `주급 · ${workedDays.length}회 ${totalHours}시간`,
    amount: totalAmount,
  };
}

export function toCurrentWeekLabels(today: string): WeekDayLabel[] {
  const todayDate = toDate(today);
  const mondayOffset = (todayDate.getDay() + 6) % 7;
  const monday = new Date(todayDate);
  monday.setDate(todayDate.getDate() - mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      weekdayLabel: format(date, "EEE", { locale: ko }),
      dayNumber: date.getDate(),
    };
  });
}

export function toWeekFooter(
  week: { days: readonly WeekDay[] },
  selectedDate: string | null,
): WeekFooter {
  if (selectedDate === null) {
    return toWeekSummaryFooter(week.days);
  }

  const selected = week.days.find((day) => day.date === selectedDate);
  if (!selected || !selected.hasShift || !selected.shift) {
    return toWeekSummaryFooter(week.days);
  }

  const { shift } = selected;
  const dateLabel = format(toDate(selected.date), "M월 d일 EEE", { locale: ko });

  return {
    caption: `${dateLabel} · ${shift.position} ${shift.hours}시간`,
    amount: shift.amount,
  };
}
