const FULL = 100;

type BarWidth = `${number}%`;

export function barWidths(values: readonly number[]): (BarWidth | null)[] {
  const highest = Math.max(0, ...values);

  return values.map((value): BarWidth | null =>
    value > 0 && highest > 0 ? `${(value / highest) * FULL}%` : null,
  );
}
