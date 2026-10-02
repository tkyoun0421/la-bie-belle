/**
 * 리허설의 모양이다 — 그날 무엇으로 받는지와, 받은 것을 센 결과다. 정본은
 * `docs/2-design/modules/schedule/design.md`의 「리허설」과
 * `docs/2-design/modules/schedule/README.md`의 SCH-023이다.
 *
 * **갈래가 날마다 갈린다.** 살아 있는 정규 배정이 있는 날은 건수로, 없는 날은 시각으로
 * 받는다 — 두 갈래가 한 달력에 같이 서고 칸 모양과 시트 모양이 이 값으로 갈린다.
 *
 * 합계가 건수와 분을 같이 드는 것은 「3건 · 5시간」이 한 줄이라서다. 건수는 줄 수가 아니다 —
 * 건수 갈래 줄은 제 `count`만큼, 시각 갈래 줄은 한 건으로 센다.
 */

export type RehearsalKind = "count" | "time";

export type RehearsalTotal = {
  count: number;
  minutes: number;
};
