export function monthStart(month: string): string {
  return `${month.slice(0, 7)}-01`;
}

export function nextMonthStart(month: string): string {
  const [year, index] = month.slice(0, 7).split("-").map(Number);
  const rolls = index === 12;

  return [
    String(rolls ? year + 1 : year).padStart(4, "0"),
    String(rolls ? 1 : index + 1).padStart(2, "0"),
    "01",
  ].join("-");
}
