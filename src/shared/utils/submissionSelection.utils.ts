export function toggleSelectedDate(
  selected: readonly string[],
  date: string,
): string[] {
  return selected.includes(date)
    ? selected.filter((picked) => picked !== date)
    : [...selected, date];
}
