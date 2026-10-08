export function monthIn<Loaded extends { month: string }>(
  loaded: readonly Loaded[] | undefined,
  month: string,
): Loaded | undefined {
  return loaded?.find((one) => one.month === month);
}
