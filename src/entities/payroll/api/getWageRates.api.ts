import type { DB } from "@/shared/api/database";
import type {
  DefaultWageRateRow,
  MemberWageRateRow,
} from "@/entities/payroll/api/payroll.dto";
import type { WageRates } from "@/entities/payroll/model/payroll.type";
import {
  toMemberWageRate,
  toWageRate,
} from "@/entities/payroll/utils/payroll.mapper";

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
    wageRates: (wageRates.data ?? []).map(toMemberWageRate),
    defaultWageRate:
      defaultWageRate.data === null ? null : toWageRate(defaultWageRate.data),
  };
}
