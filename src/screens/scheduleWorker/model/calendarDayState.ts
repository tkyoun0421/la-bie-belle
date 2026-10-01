import type { ScheduleDayCellState } from "@/shared/ui/ScheduleDayCell";

/**
 * 확정된 달의 달력 칸 하나가 어느 상태로 서는지 정한다. 색과 모양의 정본은
 * `docs/2-design/design-system/components.md`의 「근무표 날짜 칸」이고, 여기는 어느 날이 어느
 * 상태인지를 가른다.
 *
 * **「내 근무만」은 면만 뺀다.** 내가 안 나가는 날이 `open`에서 `muted`로 바뀌는데, 날짜 글자는
 * 그대로 `fg.neutral-muted`고 칸도 그대로 눌린다 — 면이 없어진 것이지 날이 없어진 것이 아니다.
 * 닫힌 날(`closed`)은 더 흐린 글자로 남아 둘이 갈린다.
 *
 * **요청 온 날은 켜도 점선이 남는다.** 회색 면은 「그날 예식이 있다」는 말이고 점선은
 * 「나한테 요청이 왔다」는 말이라 뜻이 다르다.
 */

export type CalendarDayInput = {
  isOpen: boolean;
  isMyAssignment: boolean;
  hasIncomingRequest: boolean;
  showMineOnly: boolean;
};

export function calendarDayState({
  isOpen,
  isMyAssignment,
  hasIncomingRequest,
  showMineOnly,
}: CalendarDayInput): ScheduleDayCellState {
  if (!isOpen) {
    return "closed";
  }

  if (isMyAssignment) {
    return "assigned";
  }

  if (hasIncomingRequest) {
    return "requested";
  }

  return showMineOnly ? "muted" : "open";
}
