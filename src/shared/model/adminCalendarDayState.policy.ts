import type { ScheduleDayCellState } from "@/shared/ui/ScheduleDayCell";

export type AdminCalendarDayStateInput = {
  isOpen: boolean;
  isPicked: boolean;
};

export function adminCalendarDayState({
  isOpen,
  isPicked,
}: AdminCalendarDayStateInput): ScheduleDayCellState {
  if (isPicked) {
    return "admin-picked";
  }

  return isOpen ? "admin-open" : "closed";
}

export type ConfirmedVacancyCountInput = {
  isConfirmed: boolean;
  openSlotCount: number;
};

export function confirmedVacancyCount({
  isConfirmed,
  openSlotCount,
}: ConfirmedVacancyCountInput): number | null {
  return isConfirmed ? openSlotCount : null;
}
