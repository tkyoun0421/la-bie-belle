import { spellMinutes } from "@/entities/rehearsal/utils/spellTotal.utils";

export type RehearsalDayCellState = "empty" | "has";

export type RehearsalDayCell = {
  state: RehearsalDayCellState;
  label: string;
};

export function rehearsalDayCell(minutes: number): RehearsalDayCell {
  if (minutes === 0) {
    return { state: "empty", label: "" };
  }

  return { state: "has", label: spellMinutes(minutes) };
}
