import {
  latestWageRate,
  wageRatesOf,
  type WageRateRow,
} from "@/screens/wages/model/wage-rows";

/**
 * 기본 시급을 따르는 사람이 몇인지다. 기본 시급 줄 아래와 기본 시급 시트가 같은 수를
 * 말한다 — 한 번 누르면 이 사람들의 급여가 같이 달라지는 자리라 그 수가 손 앞에 있어야
 * 한다(wages.md 「기본 시급 줄」).
 *
 * **시급 이력이 아예 없는 사람도 따르는 사람이다**([PAY-012](../../../../docs/2-design/modules/payroll/README.md#pay-012)).
 * 기본 시급이 서기 전에 승인된 자리고, 기본이 처음 서는 순간 `set_default_wage`가 같이
 * 데려간다 — 서버가 세는 쪽과 같은 판정이다.
 *
 * 세는 대상은 화면이 세운 사람들이다. 퇴사한 사람은 목록에 없어 여기도 안 든다(PAY-020).
 */

export type { WageRateRow };

export function countFollowers(
  profileIds: readonly string[],
  wageRates: readonly WageRateRow[],
): number {
  return profileIds.filter(
    (profileId) =>
      latestWageRate(wageRatesOf(wageRates, profileId))?.follows_default !==
      false,
  ).length;
}
