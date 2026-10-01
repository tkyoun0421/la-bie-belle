import type { ScheduleDayCellState } from "@/shared/ui/ScheduleDayCell";

/**
 * 관리자 달력 칸 하나가 어느 상태로 서는지다. 정본은
 * `docs/2-design/design-system/components.md`의 「근무표 날짜 칸」과
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「달력 칸」이다.
 *
 * **고른 것이 열린 것을 덮는다.** 열기 모드에서 고른 칸은 열렸든 안 열렸든 고른 모습이다 —
 * 무엇을 고르고 있는지가 그 모드의 전부라서다. 이미 연 날은 애초에 안 골라지고
 * (`open-mode-selection.ts`) 그 판정은 이 칸 상태가 아니라 누를 수 있는지가 든다.
 *
 * **오늘과 지난 날은 여기 없다.** 오늘은 칸 배경이 아니라 날짜를 감싸는 검은 원이라
 * `ScheduleDayCell`이 `isToday`로 따로 그리고, 지난 날짜는 고를 수 있는지의 문제다.
 */

export type AdminCalendarDayStateInput = {
  isOpen: boolean;
  isPicked: boolean;
};

export function adminCalendarDayState({
  isOpen,
  isPicked,
}: AdminCalendarDayStateInput): ScheduleDayCellState {
  if (isPicked) {
    return "admin-picked";
  }

  return isOpen ? "admin-open" : "closed";
}

export type ConfirmedVacancyCountInput = {
  isConfirmed: boolean;
  openSlotCount: number;
};

/**
 * 확정 뒤에만 칸 바닥에 서는 빈 자리 수다. 확정 전에는 `null`이라 칸이 신청 수를 그린다 —
 * 짜는 중에 빈 자리를 세면 아직 안 채운 것이 전부 결원으로 보인다.
 */
export function confirmedVacancyCount({
  isConfirmed,
  openSlotCount,
}: ConfirmedVacancyCountInput): number | null {
  return isConfirmed ? openSlotCount : null;
}
