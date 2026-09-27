/**
 * 그날의 시급이다 — `effective_date <= 그날` 중 **가장 늦은 행**의 금액이다
 * (`docs/2-design/modules/payroll/README.md`의 PAY-008·PAY-011).
 *
 * 첫 행보다 이른 날은 `null`이다. 승인 전 날짜라 급여가 날 수 없고, 0원으로 내면 「일했는데
 * 0원」과 구별이 안 된다 — 부르는 쪽이 그 날을 목록에서 뺀다.
 */

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
