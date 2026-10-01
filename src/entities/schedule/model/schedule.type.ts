/**
 * 홀의 포지션 아홉과 그 순서다. 정본은
 * `docs/2-design/modules/schedule/README.md`의 용어 표와 SCH-011이다.
 *
 * **화면 것이 아니라 업무 상수라 여기 산다.** 같은 배열이 근무표 두 화면에 두 벌로 있었고,
 * 관리자 통계가 셋째 벌을 세울 자리였다 — 슬라이스끼리는 서로를 못 부르니(lint 규칙 3) 공용
 * 자리가 entities다. `shared/utils/kstDate.ts`가 앞서 밟은 길이다.
 *
 * **겸임 자리는 앞 포지션이 대표다.** SQL의 `slots.positions[1]`, 배열의 `positions[0]`이
 * 그것이고 명단도 자리 셈도 통계도 그 하나로 센다 —
 * `docs/2-design/system/screens/stats.md`의 「근무 포지션 구획」이 그 자리다.
 */

export const POSITION_ORDER = [
  "팀장",
  "스캔",
  "메인",
  "드레스",
  "축가",
  "매니저",
  "안내",
  "드레스실",
  "대기실",
] as const;

export type Position = (typeof POSITION_ORDER)[number];
