import type { Shift } from "@/views/home/model/home-view-model";

const MAX_UPCOMING_SHIFTS = 3;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export type UpcomingShiftTier = "d1" | "d2" | "neutral";

export type UpcomingShift = {
  date: string;
  position: string;
  startTime: string;
  endTime: string;
  daysUntil: number;
  label: string;
  tier: UpcomingShiftTier;
};

function daysBetween(today: string, date: string): number {
  const start = new Date(`${today}T00:00:00Z`).getTime();
  const end = new Date(`${date}T00:00:00Z`).getTime();
  return Math.round((end - start) / MILLISECONDS_PER_DAY);
}

function tierOf(daysUntil: number): UpcomingShiftTier {
  if (daysUntil === 1) {
    return "d1";
  }
  if (daysUntil === 2) {
    return "d2";
  }
  return "neutral";
}

export function toUpcomingShifts(shifts: readonly Shift[], today: string): UpcomingShift[] {
  return shifts
    .map((shift) => ({ shift, daysUntil: daysBetween(today, shift.date) }))
    .filter((entry) => entry.daysUntil > 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, MAX_UPCOMING_SHIFTS)
    .map((entry) => ({
      date: entry.shift.date,
      position: entry.shift.position,
      startTime: entry.shift.startTime,
      endTime: entry.shift.endTime,
      daysUntil: entry.daysUntil,
      label: `D-${entry.daysUntil}`,
      tier: tierOf(entry.daysUntil),
    }));
}
