import type { MemberWageRate } from "@/entities/payroll/model/payroll.type";

export type WageRowMember = {
  profileId: string;
  displayName: string;
  photoUrl?: string | null;
};

export type WageRow = WageRowMember & {
  amount: number | null;
};

export function latestWageRate(
  rows: readonly MemberWageRate[],
): MemberWageRate | null {
  return rows.reduce<MemberWageRate | null>(
    (kept, row) =>
      kept === null || row.effectiveDate > kept.effectiveDate ? row : kept,
    null,
  );
}

export function wageRatesOf(
  rows: readonly MemberWageRate[],
  profileId: string,
): MemberWageRate[] {
  return rows.filter((row) => row.profileId === profileId);
}

export function buildWageRows(
  members: readonly WageRowMember[],
  wageRates: readonly MemberWageRate[],
): WageRow[] {
  return members.map((member) => ({
    ...member,
    amount:
      latestWageRate(wageRatesOf(wageRates, member.profileId))?.amount ?? null,
  }));
}
