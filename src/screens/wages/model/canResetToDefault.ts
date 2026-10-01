import {
  latestWageRate,
  type WageRateRow,
} from "@/screens/wages/model/wageRows";

/**
 * 사람 시트에 「기본 시급으로 되돌리기」 줄을 그릴지다. 받는 것은 그 사람의 행만이다.
 *
 * **기본을 쓰는 사람에게는 줄이 없다.** 이미 붙어 있다. 시급 이력이 아예 빈 사람도 그쪽이다
 * ([PAY-012](../../../../docs/2-design/modules/payroll/README.md#pay-012)).
 *
 * **기본 시급이 아직 없으면 개별로 정한 사람에게도 없다.** 돌아갈 자리가 없고, 눌러도
 * 함수가 `no_default_wage`로 거절한다 — 화면이 먼저 안 그린다.
 */

export type { WageRateRow };

export function canResetToDefault(
  wageRates: readonly WageRateRow[],
  hasDefaultWage: boolean,
): boolean {
  return hasDefaultWage && latestWageRate(wageRates)?.follows_default === false;
}
