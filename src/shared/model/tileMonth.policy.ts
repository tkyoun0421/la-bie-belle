export type TileMonthInput = {
  todayMonth: string;
  todayMonthConfirmed: boolean;
};

export function tileMonth({
  todayMonth,
  todayMonthConfirmed,
}: TileMonthInput): string {
  if (!todayMonthConfirmed) {
    return todayMonth;
  }

  const [year, index] = todayMonth.split("-").map(Number);
  const rolled = index === 12;

  return `${String(rolled ? year + 1 : year).padStart(4, "0")}-${String(
    rolled ? 1 : index + 1,
  ).padStart(2, "0")}`;
}
