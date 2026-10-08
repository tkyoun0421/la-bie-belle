import { monthOf } from "@/shared/utils/kstDate";

export function canGoToPreviousMonth(
  month: string,
  firstScheduleMonth: string,
): boolean {
  return month > monthOf(firstScheduleMonth);
}

export function canGoToNextMonth(month: string, today: string): boolean {
  return month < monthOf(today);
}
