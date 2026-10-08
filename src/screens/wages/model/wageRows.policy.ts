import type { MemberWageRateRow } from "@/entities/payroll/api/payroll.dto";

export type WageRowMember = {
  profileId: string;
  displayName: string;
  photoUrl?: string | null;
};

export type WageRow = WageRowMember & {
  amount: number | null;
};

export function latestWageRate(
  rows: readonly MemberWageRateRow[],
): MemberWageRateRow | null {
  return rows.reduce<MemberWageRateRow | null>(
    (kept, row) =>
      kept === null || row.effective_date > kept.effective_date ? row : kept,
    null,
  );
}

export function wageRatesOf(
  rows: readonly MemberWageRateRow[],
  profileId: string,
): MemberWageRateRow[] {
  return rows.filter((row) => row.profile_id === profileId);
}

export function buildWageRows(
  members: readonly WageRowMember[],
  wageRates: readonly MemberWageRateRow[],
): WageRow[] {
  return members.map((member) => ({
    ...member,
    amount:
      latestWageRate(wageRatesOf(wageRates, member.profileId))?.amount ?? null,
  }));
}
