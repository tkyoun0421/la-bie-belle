import { type MemberWageRate } from "@/entities/payroll/model/payroll.type";
import { WAGES_COPY } from "@/screens/wages/consts/wages.const";
import {
  latestWageRate,
  wageRatesOf,
} from "@/screens/wages/model/wageRows.policy";

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
      ? WAGES_COPY.noFollower
      : `${followerCount}${WAGES_COPY.followerSuffix}`;
  }

  return followerCount === 0
    ? WAGES_COPY.willFollowNone
    : `${WAGES_COPY.willFollowPrefix}${followerCount}${WAGES_COPY.willFollowSuffix}`;
}

export function spellFollowerChangeLine(followerCount: number): string {
  return followerCount === 0
    ? WAGES_COPY.noFollower
    : `${followerCount}${WAGES_COPY.followerChangeSuffix}`;
}
