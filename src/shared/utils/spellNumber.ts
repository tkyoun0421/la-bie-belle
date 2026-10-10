import { MINUTES_PER_HOUR } from "@/shared/consts/time.const";

const THOUSANDS = /\B(?=(\d{3})+(?!\d))/g;

export function spellWon(amount: number): string {
  return `${String(amount).replace(THOUSANDS, ",")}원`;
}

export function spellDuration(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;

  if (rest === 0) {
    return `${hours}시간`;
  }

  return hours === 0 ? `${rest}분` : `${hours}시간 ${rest}분`;
}
