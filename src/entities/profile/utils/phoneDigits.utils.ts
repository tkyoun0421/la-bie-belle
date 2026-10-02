/**
 * 전화번호와 생년월일이 칸과 글 사이를 오가는 손이다. 정본은
 * `docs/2-design/modules/account/screens/login.md`의 「칸은 숫자만 받는다」다.
 *
 * **칸은 숫자만 받고 하이픈은 앱이 넣는다.** 사람이 안 치고 화면이 끊어 넣어, 굳은 글과
 * 서버가 보는 꼴이 같다.
 */

/** 하이픈이 다 들어간 열한 자리 아래로는 끊을 자리가 안 정해진다. */
const HYPHENATE_FROM = 8;

export function digitsOnly(typed: string, limit: number): string {
  return typed.replace(/\D/g, "").slice(0, limit);
}

export function hyphenatePhone(digits: string): string {
  if (digits.length < HYPHENATE_FROM) {
    return digits;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}
