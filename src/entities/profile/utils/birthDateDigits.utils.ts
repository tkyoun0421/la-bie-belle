/**
 * 생년월일이 사는 꼴 셋 사이를 오가는 손이다 — DB의 `1993-04-21`, 칸의 `19930421`, 글의
 * 「1993년 4월 21일」. 정본은 `docs/2-design/modules/account/screens/login.md`다.
 *
 * **나이는 안 적는다.** 그 셈이 필요한 자리는 관리자 쪽이고
 * (`formatBirthDate.utils.ts`), 본인이 보는 글에는 날짜만 선다.
 */

export function spellBirthDate(digits: string): string {
  const year = digits.slice(0, 4);
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));

  return `${year}년 ${month}월 ${day}일`;
}

export function digitsOfBirthDate(isoDate: string | null): string {
  return isoDate === null ? "" : isoDate.replaceAll("-", "");
}

export function isoDateOfDigits(digits: string): string {
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}
