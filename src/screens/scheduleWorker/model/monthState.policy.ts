import { DAY_MS } from "@/shared/consts/time.const";

export type MonthState =
  "not_created" | "collecting" | "closed_awaiting_confirmation" | "confirmed";

export type MonthStateInput = {
  schedule: {
    applicationDeadline: string | null;
    confirmedAt: string | null;
  } | null;
  today: string;
};

export function monthState({ schedule, today }: MonthStateInput): MonthState {
  if (schedule === null) {
    return "not_created";
  }

  if (schedule.confirmedAt !== null) {
    return "confirmed";
  }

  if (
    schedule.applicationDeadline !== null &&
    schedule.applicationDeadline >= today
  ) {
    return "collecting";
  }

  return "closed_awaiting_confirmation";
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function spellDeadline(deadline: string, today: string): string {
  const [, month, day] = deadline.split("-").map(Number);
  const remaining = Math.round(
    (Date.parse(`${deadline}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) /
      DAY_MS,
  );

  if (remaining < 0) {
    return `스케줄 신청이 ${month}월 ${day}일에 마감됐어요`;
  }

  const weekday = WEEKDAYS[new Date(`${deadline}T00:00:00Z`).getUTCDay()];
  const left = remaining === 0 ? "오늘까지예요" : `${remaining}일 남았어요`;

  return `스케줄 신청 마감 ${month}월 ${day}일(${weekday}) · ${left}`;
}
