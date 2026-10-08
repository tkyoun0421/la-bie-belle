import { spellDate } from "@/shared/utils/kstDate";

import type { SlotRequest } from "@/entities/workRequest/model/workRequest.type";

export type RequestLine = Pick<
  SlotRequest,
  "positions" | "workDate" | "startsAt" | "endsAt"
>;

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

export function requestSubtitle({
  positions,
  workDate,
  startsAt,
  endsAt,
}: RequestLine): string {
  return `${spellDate(workDate)} · ${positions[0] ?? ""} · ${clockLabel(startsAt)} – ${clockLabel(endsAt)}`;
}

export function claimedLine({ positions, workDate }: RequestLine): string {
  const [, month, day] = workDate.split("-").map(Number);

  return `${month}월 ${day}일 ${positions[0] ?? ""} 자리는 다른 분이 맡았어요`;
}

export function cancelSheetTitle(workDate: string, position: string): string {
  return `근무 취소 · ${spellDate(workDate)} ${position}`;
}
