import type {
  AdjustmentRow,
  DefaultWageRateRow,
  ExcuseStatusRow,
  HolidayRow,
  MemberWageRateRow,
} from "@/entities/payroll/api/payroll.dto";
import type {
  Adjustment,
  ExcuseStatus,
  Holiday,
  MemberWageRate,
  WageRate,
} from "@/entities/payroll/model/payroll.type";

export function toWageRate(row: DefaultWageRateRow): WageRate {
  return { effectiveDate: row.effective_date, amount: row.amount };
}

export function toMemberWageRate(row: MemberWageRateRow): MemberWageRate {
  return {
    ...toWageRate(row),
    profileId: row.profile_id,
    followsDefault: row.follows_default,
  };
}

export function toAdjustment(row: AdjustmentRow): Adjustment {
  return {
    id: row.id,
    dayId: row.day_id,
    profileId: row.profile_id,
    minutes: row.minutes,
    adjustedAt: row.adjusted_at,
  };
}

export function toExcuseStatus(row: ExcuseStatusRow): ExcuseStatus {
  return {
    dayId: row.day_id,
    profileId: row.profile_id,
    submittedAt: row.submitted_at,
    decidedAt: row.decided_at,
    decision: row.decision,
  };
}

export function toHoliday(row: HolidayRow): Holiday {
  return {
    holidayDate: row.holiday_date,
    source: row.source,
    name: row.name,
  };
}
