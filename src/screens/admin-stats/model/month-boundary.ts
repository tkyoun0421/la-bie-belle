/**
 * 달 줄의 화살표가 서는지다. 못 가는 화살표는 흐리게 그리지 않고 아예 안 그린다 — 자리만
 * 남긴다(`docs/2-design/system/screens/stats.md`의 「통계 색」).
 *
 * **바닥은 첫 근무표가 있는 달이다.** 홀 하나뿐이라 질의 한 번이면 나온다
 * (`entities/schedule/dals/get-first-schedule-month.ts`) — 급여 조회가 사람마다 다른 바닥을
 * 승인일로 대신한 것과 갈리는 자리다.
 *
 * **천장은 이번 달이다.** 아직 오지 않은 달에는 셀 것이 없다.
 *
 * 둘 다 달까지만 견준다. 바닥과 오늘은 날짜로 오는데 날짜끼리 견주면 그 날이 든 달 안에서
 * 화살표가 하루치만큼 살아 있게 된다.
 */

const MONTH_LENGTH = 7;

export function canGoBack(month: string, firstScheduleMonth: string): boolean {
  return month > monthOf(firstScheduleMonth);
}

export function canGoForward(month: string, today: string): boolean {
  return month < monthOf(today);
}

function monthOf(date: string): string {
  return date.slice(0, MONTH_LENGTH);
}
