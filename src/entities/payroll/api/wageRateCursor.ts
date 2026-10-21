import type { MemberWageRateRow } from "@/entities/payroll/api/payroll.dto";

type WageRateKey = Pick<MemberWageRateRow, "profile_id" | "effective_date">;

export function afterWageRate(after: WageRateKey): string {
  return `profile_id.gt.${after.profile_id},and(profile_id.eq.${after.profile_id},effective_date.gt.${after.effective_date})`;
}
