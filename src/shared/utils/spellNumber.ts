const THOUSANDS = /\B(?=(\d{3})+(?!\d))/g;

const MINUTES_PER_HOUR = 60;

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
