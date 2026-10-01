import { WAGE_MAX } from "@/screens/wages/consts/wages.const";
/**
 * 두 시트가 같이 쓰는 금액 규칙이다. 상한도 하한도 저장 가능 여부도 한 조각이 든다 —
 * 시트마다 따로 두면 한쪽만 고쳐지고, 두 시트가 같은 칸에 같은 값을 받는다
 * (wages.md 「기본 시급 시트」 마지막 문단).
 *
 * **상한 100,000원을 넘는 타이핑은 안 들어간다.** 자릿수 오타를 거르는 선이라 값을 잘라
 * 넣지 않고 이전 값을 그대로 둔다 — 12,000을 120,000으로 친 손에 12,000이 남아야 무엇이
 * 막혔는지 보인다. 표도 같은 값을 든다(`wage_rates` check).
 *
 * **하한은 0 초과 하나다.** 최저임금을 안 본다 — 해마다 바뀌는 값을 앱이 들면 안 고쳤을 때
 * 틀린 경고가 서고, 틀린 경고는 없는 경고보다 나쁘다(wages.md 「규칙과 부딪힌 자리」).
 *
 * 값은 자릿수 문자열로 든다. 화면이 보여주는 것은 쉼표가 박힌 꼴이지만 판정과 저장은 숫자
 * 그대로라, 둘을 갈라야 「치는 동안 쉼표가 따라 들어간다」가 값의 의미를 안 흔든다.
 */

const NOT_DIGIT = /\D/g;

const THOUSANDS = /\B(?=(\d{3})+(?!\d))/g;

export function nextAmountDigits(previous: string, typed: string): string {
  const digits = typed.replace(NOT_DIGIT, "");

  if (digits === "") {
    return "";
  }

  const amount = Number(digits);

  return amount > WAGE_MAX ? previous : String(amount);
}

export function canSaveWage(digits: string, current: number | null): boolean {
  const amount = Number(digits);

  return digits !== "" && amount > 0 && amount !== current;
}

export function atWageCap(digits: string): boolean {
  return digits !== "" && Number(digits) === WAGE_MAX;
}

export function formatAmountDisplay(digits: string): string {
  return digits.replace(THOUSANDS, ",");
}
