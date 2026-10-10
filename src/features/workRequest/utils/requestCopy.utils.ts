import { clockOf, spellDate } from "@/shared/utils/kstDate";
import type { SlotRequest } from "@/entities/workRequest/model/workRequest.type";

export type RequestLine = Pick<
  SlotRequest,
  "positions" | "workDate" | "startsAt" | "endsAt"
>;

export function requestSubtitle({
  positions,
  workDate,
  startsAt,
  endsAt,
}: RequestLine): string {
  return `${spellDate(workDate)} · ${positions[0] ?? ""} · ${clockOf(startsAt)} – ${clockOf(endsAt)}`;
}

export function claimedLine({ positions, workDate }: RequestLine): string {
  const [, month, day] = workDate.split("-").map(Number);

  return `${month}월 ${day}일 ${positions[0] ?? ""} 자리는 다른 분이 맡았어요`;
}

export function cancelSheetTitle(workDate: string, position: string): string {
  return `근무 취소 · ${spellDate(workDate)} ${position}`;
}
