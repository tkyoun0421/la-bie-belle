export type DayHoursFormInput = {
  starts: string;
  ends: string;
};

export function isDayHoursSaveEnabled({
  starts,
  ends,
}: DayHoursFormInput): boolean {
  return ends > starts;
}

export function dayHoursLine(startsAt: string, endsAt: string): string {
  return `근무 시간 · ${startsAt.slice(0, 5)}–${endsAt.slice(0, 5)}`;
}
