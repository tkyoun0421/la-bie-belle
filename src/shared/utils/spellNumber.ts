const THOUSANDS = /\B(?=(\d{3})+(?!\d))/g;

export function spellWon(amount: number): string {
  return `${String(amount).replace(THOUSANDS, ",")}원`;
}
