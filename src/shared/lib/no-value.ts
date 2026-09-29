/**
 * 값을 못 구한 자리에 서는 글자다. `0`이 아니다 — 0은 셈이 끝난 값이고 이것은 아직 셀 것이
 * 없다는 뜻이다(`docs/2-design/system/screens/stats.md`의 「빈 상태」,
 * `docs/2-design/modules/payroll/screens/payroll.md`의 「금액」).
 *
 * **슬라이스 셋이 같은 글자를 쓴다.** 통계 둘과 급여가 각자 들고 있으면 한 화면에서 같은
 * 자리가 다른 글자로 선다 — 슬라이스끼리는 서로를 못 부르니(lint 규칙 3) 공용 자리가 여기다.
 * `kst-date.ts`가 앞서 밟은 길이다.
 */

export const NO_VALUE = "–";
