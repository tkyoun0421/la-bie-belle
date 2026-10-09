const CLOCK_LENGTH = 5;

export type DayHoursFormInput = {
  starts: string;
  ends: string;
};

export function clockLabel(clock: string): string {
  return clock.slice(0, CLOCK_LENGTH);
}

export function isDayHoursSaveEnabled({
  starts,
  ends,
}: DayHoursFormInput): boolean {
  return ends > starts;
}

export function dayHoursLine(startsAt: string, endsAt: string): string {
  return `근무 시간 · ${clockLabel(startsAt)}–${clockLabel(endsAt)}`;
}
