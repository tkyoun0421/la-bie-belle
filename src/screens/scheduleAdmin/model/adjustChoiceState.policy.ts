const DIGITS_ONLY = /[^0-9]/g;

export type AdjustChoiceRow = {
  minutes: number;
};

export function showRevertOption(rows: readonly AdjustChoiceRow[]): boolean {
  return rows.length > 0;
}

export function nextMinuteDigits(text: string): string {
  return text.replace(DIGITS_ONLY, "");
}

export function extraMinutes(digits: string): number | null {
  const minutes = Number(digits);

  return digits === "" || minutes === 0 ? null : minutes;
}
