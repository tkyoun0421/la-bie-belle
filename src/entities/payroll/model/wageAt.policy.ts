import type { WageRate } from "@/entities/payroll/model/payroll.type";

export function wageAt(
  rates: readonly WageRate[],
  date: string,
): number | null {
  const effective = rates.reduce<WageRate | null>(
    (kept, rate) =>
      rate.effectiveDate <= date &&
      (kept === null || rate.effectiveDate > kept.effectiveDate)
        ? rate
        : kept,
    null,
  );

  return effective?.amount ?? null;
}
