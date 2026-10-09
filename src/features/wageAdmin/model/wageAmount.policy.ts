import { WAGE_MAX } from "@/features/wageAdmin/consts/wageAdmin.const";

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
