import { type MemberWageRate } from "@/entities/payroll/model/payroll.type";
import {
  latestWageRate,
  wageRatesOf,
} from "@/entities/payroll/model/wageRows.policy";
import { WAGE_SHEET_COPY } from "@/features/wageAdmin/consts/wageAdmin.const";

export function countFollowers(
  profileIds: readonly string[],
  wageRates: readonly MemberWageRate[],
): number {
  return profileIds.filter(
    (profileId) =>
      latestWageRate(wageRatesOf(wageRates, profileId))?.followsDefault !==
      false,
  ).length;
}

export function spellBaseWageNote(input: {
  hasDefaultWage: boolean;
  followerCount: number;
}): string {
  const { hasDefaultWage, followerCount } = input;

  if (hasDefaultWage) {
    return followerCount === 0
      ? WAGE_SHEET_COPY.noFollower
      : `${followerCount}${WAGE_SHEET_COPY.followerSuffix}`;
  }

  return followerCount === 0
    ? WAGE_SHEET_COPY.willFollowNone
    : `${WAGE_SHEET_COPY.willFollowPrefix}${followerCount}${WAGE_SHEET_COPY.willFollowSuffix}`;
}

export function spellFollowerChangeLine(followerCount: number): string {
  return followerCount === 0
    ? WAGE_SHEET_COPY.noFollower
    : `${followerCount}${WAGE_SHEET_COPY.followerChangeSuffix}`;
}
