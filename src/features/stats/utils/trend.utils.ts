import { shiftMonth } from "@/shared/utils/kstDate";

/**
 * 추이 그래프가 찍는 열두 달이다. 정본은 `docs/2-design/system/screens/stats.md`의 「추이
 * 그래프」고 완료 조건은 `docs/2-design/spec/stats-admin.md`의 AC-03이다.
 *
 * **보는 달이 오른쪽 끝이다.** 거기서 열한 달을 거슬러 올라간 구간이라 달 줄로 지난달을
 * 고르면 창 전체가 한 칸 왼쪽으로 밀린다.
 *
 * **열두 달인 이유는 성수기다.** 예식장은 봄과 가을에 몰려서 여섯 달만 보면 10월에 열었을 때
 * 지난봄이 잘려 나간다.
 *
 * **값이 없는 달과 0인 달이 다르다.** 앱을 쓰기 전 달은 `null`이라 선이 거기서 끊기고, 세어
 * 봤더니 0인 달은 0으로 바닥에 선다. 0으로 이으면 그 달에 일을 안 한 것처럼 읽힌다.
 */

const TREND_MONTHS = 12;

export type TrendPoint = {
  month: string;
  value: number | null;
};

export function trendMonths(viewingMonth: string): string[] {
  return Array.from({ length: TREND_MONTHS }, (_, at) =>
    shiftMonth(viewingMonth, at - (TREND_MONTHS - 1)),
  );
}

export function buildTrend(
  months: readonly string[],
  valueByMonth: ReadonlyMap<string, number>,
): TrendPoint[] {
  return months.map((month) => ({
    month,
    value: valueByMonth.get(month) ?? null,
  }));
}
