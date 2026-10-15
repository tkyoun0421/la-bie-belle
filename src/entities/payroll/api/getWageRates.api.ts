import type { DB } from "@/shared/api/database";
import { readAllPages } from "@/shared/api/readAllPages";
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
    readAllPages((from, to) =>
      client
        .from("wage_rates")
        .select(MEMBER_WAGE_COLUMNS)
        .order("effective_date", { ascending: false })
        .order("profile_id")
        .range(from, to)
        .returns<MemberWageRateRow[]>(),
    ),
    client
      .from("default_wage_rates")
      .select(DEFAULT_WAGE_COLUMNS)
      .order("effective_date", { ascending: false })
      .limit(1)
      .maybeSingle<DefaultWageRateRow>(),
  ]);

  if (defaultWageRate.error) {
    throw defaultWageRate.error;
  }

  return {
    wageRates: wageRates.map(toMemberWageRate),
    defaultWageRate:
      defaultWageRate.data === null ? null : toWageRate(defaultWageRate.data),
  };
}
