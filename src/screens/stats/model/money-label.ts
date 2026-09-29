/**
 * 급여 탭 추이 그래프의 값이다(`docs/2-design/system/screens/stats.md`의 「그래프 값 — 급여」).
 *
 * **그래프에서만 줄여 적는다.** 합계 자리는 「1,296,000원」 그대로고 그래프 값만 「130만」이다 —
 * 점 열둘 위에 여섯 자리 숫자가 서면 읽히지 않는다.
 */

const TEN_THOUSAND = 10000;

export function tenThousandWonLabel(amount: number): string {
  return `${Math.round(amount / TEN_THOUSAND)}만`;
}
