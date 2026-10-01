/**
 * 금액 한 덩이다 — 「108,000원」. 세 자리마다 쉼표를 찍고 「원」을 붙인다
 * (`docs/2-design/design-system/writing.md`의 「숫자와 단위」).
 *
 * **슬라이스 셋이 같은 글자를 쓴다.** 급여 조회와 시급과 통계가 각자 들면 같은 금액이 화면마다
 * 다른 꼴로 선다 — 슬라이스끼리는 서로를 못 부르니(lint 규칙 3) 공용 자리가 여기다.
 * `kst-date.ts`와 `no-value.ts`가 앞서 밟은 길이다.
 *
 * **0은 「0원」이다.** 셈이 끝나 0이 난 자리라 아직 셀 것이 없는 자리(`NO_VALUE`)와 갈린다.
 */

const THOUSANDS = /\B(?=(\d{3})+(?!\d))/g;

export function spellWon(amount: number): string {
  return `${String(amount).replace(THOUSANDS, ",")}원`;
}
