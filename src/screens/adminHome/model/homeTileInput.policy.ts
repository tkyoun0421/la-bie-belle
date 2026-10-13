import type { MonthWindow } from "@/entities/schedule/model/schedule.type";
import type { HomeTileSummaryInput } from "@/screens/adminHome/model/homeTileSummary.policy";

export function homeTileInputOf(input: {
  month: string;
  window: MonthWindow | null | undefined;
  openDays: number;
  vacancyCount: number;
}): HomeTileSummaryInput {
  const { month, window, openDays, vacancyCount } = input;

  if (window == null) {
    return { state: "not_created", month };
  }

  if (window.confirmedAt != null) {
    return { state: "confirmed", month, vacancyCount };
  }

  return { state: "in_progress", month, openDays, vacancyCount };
}
