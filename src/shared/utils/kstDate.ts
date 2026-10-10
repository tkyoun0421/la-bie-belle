import { CLOCK_LENGTH } from "@/shared/consts/time.const";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const KST_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const KST_CLOCK = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Seoul",
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
});

export function kstDateOf(instant: string | Date): string {
  return KST_DATE.format(instant instanceof Date ? instant : new Date(instant));
}

export function kstClockOf(instant: string | Date): string {
  return KST_CLOCK.format(
    instant instanceof Date ? instant : new Date(instant),
  );
}

export function clockOf(clock: string): string {
  return clock.slice(0, CLOCK_LENGTH);
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function shiftMonth(month: string, step: number): string {
  const [year, index] = month.slice(0, 7).split("-").map(Number);
  const moved = index - 1 + step;
  const movedYear = year + Math.floor(moved / 12);
  const movedIndex = ((moved % 12) + 12) % 12;

  return `${String(movedYear).padStart(4, "0")}-${String(movedIndex + 1).padStart(2, "0")}`;
}

export function spellMonth(month: string): string {
  return `${Number(month.slice(0, 4))}년 ${Number(month.slice(5, 7))}월`;
}

export function lastDateOfMonth(month: string): string {
  const [year, index] = month.slice(0, 7).split("-").map(Number);
  const last = new Date(Date.UTC(year, index, 0));

  return [
    String(last.getUTCFullYear()).padStart(4, "0"),
    String(last.getUTCMonth() + 1).padStart(2, "0"),
    String(last.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function spellDate(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];

  return `${month}월 ${day}일(${weekday})`;
}
