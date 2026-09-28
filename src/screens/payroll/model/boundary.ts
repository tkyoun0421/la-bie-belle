import {
  anchorOfDate,
  periodAnchor,
  type Period,
} from "@/screens/payroll/model/period";

/**
 * 기간 화살표가 서는지다. 못 가는 화살표는 흐리게 그리지 않고 아예 안 그린다
 * (`docs/2-design/modules/payroll/screens/payroll.md`의 「급여 조회 색」).
 *
 * **바닥은 첫 근무가 아니라 승인이다.** 승인된 달은 이미 손에 있는 프로필 한 줄이면 알지만 첫
 * 근무가 있는 달을 알려면 지난 달들을 거슬러 훑어야 한다(「첫 달 앞」). 그 차이로 빈 달이 몇 개
 * 보일 수 있고, 그 달들도 그 사람의 달이 맞다.
 *
 * **천장은 퇴사가 오늘을 대신한다.** 퇴사한 사람에게 다음 달은 일하지 않은 달이 아니라 없는
 * 달이다(ACC-011).
 *
 * 둘 다 「그 날짜가 든 기간」으로 올려 견준다 — 날짜끼리 견주면 승인일이 든 달 안에서 뒤로
 * 화살표가 하루치만큼 살아 있게 된다.
 */

export type ForwardBound = {
  today: string;
  leftAt: string | null;
};

export function canGoBack(period: Period, approvedAt: string): boolean {
  return periodAnchor(period) > anchorOfDate(approvedAt, period.unit);
}

export function canGoForward(
  period: Period,
  { today, leftAt }: ForwardBound,
): boolean {
  return periodAnchor(period) < anchorOfDate(leftAt ?? today, period.unit);
}
