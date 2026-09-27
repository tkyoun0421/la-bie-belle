import { lastDateOfMonth, shiftMonth } from "@/shared/lib/kst-date";
import { kstDateOf } from "@/screens/schedule-admin/model/format-schedule-date";

/**
 * 「전부 지난 달」 판정이다 — 그 달의 마지막 날이 오늘(KST) 이전이면 만들기 버튼이 없고
 * 빈 상태 제목만 남는다
 * (`docs/2-design/modules/schedule/screens/schedule-admin.md`의 「달 근무표 만들기 짜임」).
 *
 * **차단 축은 달이 아니라 날짜다.** 열 수 있는 날이 하루라도 남았으면(SCH-002) 지나가는
 * 중인 달도 만든다 — 마지막 날이 오늘이면 아직 안 지난 것이다.
 */

export type MonthEmptyStateInput = {
  month: string;
  now: string;
};

/**
 * 그 달의 마지막 날과 달 이동은 `@/shared/lib/kst-date`가 소유한다 — 슬라이스 넷에 같은
 * 계산이 각자 서 있던 것을 거기로 모았다. 부르는 이름은 그대로다.
 */
export { lastDateOfMonth, shiftMonth };

export function isMonthFullyPast({
  month,
  now,
}: MonthEmptyStateInput): boolean {
  return lastDateOfMonth(month) < kstDateOf(now);
}
