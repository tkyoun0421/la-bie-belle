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

function afterWageRate(after: MemberWageRateRow): string {
  return `profile_id.gt.${after.profile_id},and(profile_id.eq.${after.profile_id},effective_date.gt.${after.effective_date})`;
}

function byRecentDateThenProfile(
  left: MemberWageRateRow,
  right: MemberWageRateRow,
): number {
  if (left.effective_date !== right.effective_date) {
    return left.effective_date > right.effective_date ? -1 : 1;
  }
  return left.profile_id < right.profile_id
    ? -1
    : left.profile_id > right.profile_id
      ? 1
      : 0;
}

export async function getWageRates(client: DB): Promise<WageRates> {
  const [wageRates, defaultWageRate] = await Promise.all([
    readAllPages(
      (after: MemberWageRateRow | null, limit) => {
        const query = client.from("wage_rates").select(MEMBER_WAGE_COLUMNS);
        return (after === null ? query : query.or(afterWageRate(after)))
          .order("profile_id")
          .order("effective_date")
          .limit(limit)
          .returns<MemberWageRateRow[]>();
      },
      (row) => row,
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
    wageRates: wageRates.sort(byRecentDateThenProfile).map(toMemberWageRate),
    defaultWageRate:
      defaultWageRate.data === null ? null : toWageRate(defaultWageRate.data),
  };
}
