import { spellDate } from "@/shared/utils/kstDate";

export type RequestLine = {
  slots: {
    positions: readonly string[];
    days: { work_date: string; starts_at: string; ends_at: string };
  };
};

function clockLabel(clock: string): string {
  return clock.slice(0, 5);
}

function monthLabel(month: string): number {
  return Number(month.slice(5));
}

export function spellSubmitted(month: string): string {
  return `${monthLabel(month)}월 근무 신청을 보냈어요`;
}

export function spellNotOpen(month: string): string {
  return `아직 ${monthLabel(month)}월 근무 신청을 받지 않아요. 열리면 알려드릴게요`;
}

export function requestSubtitle({ slots }: RequestLine): string {
  const { positions, days } = slots;

  return `${spellDate(days.work_date)} · ${positions[0] ?? ""} · ${clockLabel(days.starts_at)} – ${clockLabel(days.ends_at)}`;
}

export function claimedLine({ slots }: RequestLine): string {
  const [, month, day] = slots.days.work_date.split("-").map(Number);

  return `${month}월 ${day}일 ${slots.positions[0] ?? ""} 자리는 다른 분이 맡았어요`;
}

export function cancelSheetTitle(workDate: string, position: string): string {
  return `근무 취소 · ${spellDate(workDate)} ${position}`;
}
