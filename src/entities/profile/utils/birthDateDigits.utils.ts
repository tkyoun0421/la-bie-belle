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
