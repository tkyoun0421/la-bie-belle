import { clockOf } from "@/shared/utils/kstDate";

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
  return `근무 시간 · ${clockOf(startsAt)}–${clockOf(endsAt)}`;
}
