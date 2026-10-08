import type { ScheduleDayCellState } from "@/shared/ui/ScheduleDayCell";

export type CalendarDayInput = {
  isOpen: boolean;
  isMyAssignment: boolean;
  hasIncomingRequest: boolean;
  showMineOnly: boolean;
};

export function calendarDayState({
  isOpen,
  isMyAssignment,
  hasIncomingRequest,
  showMineOnly,
}: CalendarDayInput): ScheduleDayCellState {
  if (!isOpen) {
    return "closed";
  }

  if (isMyAssignment) {
    return "assigned";
  }

  if (hasIncomingRequest) {
    return "requested";
  }

  return showMineOnly ? "muted" : "open";
}
