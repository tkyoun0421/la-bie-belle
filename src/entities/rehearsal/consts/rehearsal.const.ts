/**
 * 리허설의 정해진 값이다. 정본은
 * `docs/2-design/modules/schedule/README.md`의 SCH-023이다.
 */

/**
 * **1건이 1시간이다.** 건수로 넣은 것과 시각으로 넣은 것이 한 달력에 같이 서는데, 급여가
 * 갈래와 무관하게 시간만 쓰므로(`docs/2-design/modules/payroll/README.md`의 PAY-028) 건수를
 * 분으로 환산하는 비율이 여기 하나에 산다.
 *
 * 분·시 환산(60)과 값이 같지만 다른 것이다 — 이것은 우리가 정한 규칙이라 바뀔 수 있고,
 * 한 시간이 60분인 것은 안 바뀐다.
 */
export const MINUTES_PER_COUNT = 60;
