export type WageRate = {
  effective_date: string;
  amount: number;
};

export function wageAt(
  rates: readonly WageRate[],
  date: string,
): number | null {
  const effective = rates.reduce<WageRate | null>(
    (kept, rate) =>
      rate.effective_date <= date &&
      (kept === null || rate.effective_date > kept.effective_date)
        ? rate
        : kept,
    null,
  );

  return effective?.amount ?? null;
}
