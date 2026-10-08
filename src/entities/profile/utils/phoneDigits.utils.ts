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
