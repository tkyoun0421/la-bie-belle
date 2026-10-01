import type { DB } from "@/shared/api/database";

/**
 * 시급 화면이 한 번에 읽는 둘이다 — 전원의 `wage_rates` 이력 전부와 지금 서 있는 기본 시급.
 *
 * **달로 안 자른다.** `get-payroll-month.ts`는 그 달 급여를 세려고 그 달 끝일까지만 받는데,
 * 이 화면은 사람 시트의 이력을 목록이 받은 데이터에서 갈라 쓰므로(plan payroll-wages AC-05)
 * 날짜로 자르면 지난 줄이 시트에서 사라진다. 시트를 열 때 질의를 새로 안 던지는 대가다.
 *
 * **기본 시급은 가장 최근 한 행이다.** 화면이 쓰는 것은 「지금 얼마인가」뿐이고 기본 시급의
 * 이력을 그리는 자리는 없다. 한 번도 안 정했으면 `null`이라 화면이 「아직 안 정했어요」를
 * 세운다([PAY-012](../../../../docs/2-design/modules/payroll/README.md#pay-012)).
 *
 * **관리자인지를 코드가 안 나눈다.** RLS가 `wage_rates`를 「본인 행과 관리자 전원」으로,
 * `default_wage_rates`를 관리자로 이미 갈랐다.
 */

export type MemberWageRateRow = {
  profile_id: string;
  effective_date: string;
  amount: number;
  follows_default: boolean;
};

export type DefaultWageRateRow = {
  effective_date: string;
  amount: number;
};

export type WageRates = {
  wageRates: MemberWageRateRow[];
  defaultWageRate: DefaultWageRateRow | null;
};

const MEMBER_WAGE_COLUMNS = [
  "profile_id",
  "effective_date",
  "amount",
  "follows_default",
].join(", ");

const DEFAULT_WAGE_COLUMNS = ["effective_date", "amount"].join(", ");

export async function getWageRates(client: DB): Promise<WageRates> {
  const [wageRates, defaultWageRate] = await Promise.all([
    client
      .from("wage_rates")
      .select(MEMBER_WAGE_COLUMNS)
      .order("effective_date", { ascending: false })
      .returns<MemberWageRateRow[]>(),
    client
      .from("default_wage_rates")
      .select(DEFAULT_WAGE_COLUMNS)
      .order("effective_date", { ascending: false })
      .limit(1)
      .maybeSingle<DefaultWageRateRow>(),
  ]);

  if (wageRates.error) {
    throw wageRates.error;
  }
  if (defaultWageRate.error) {
    throw defaultWageRate.error;
  }

  return {
    wageRates: wageRates.data ?? [],
    defaultWageRate: defaultWageRate.data,
  };
}
