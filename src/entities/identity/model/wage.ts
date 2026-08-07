export type EffectiveWage = {
  amount: number;
  isDerived: boolean;
};

export function resolveEffectiveWage(
  hourlyWage: number | null,
  defaultHourlyWage: number,
): EffectiveWage {
  return hourlyWage === null
    ? { amount: defaultHourlyWage, isDerived: true }
    : { amount: hourlyWage, isDerived: false };
}
