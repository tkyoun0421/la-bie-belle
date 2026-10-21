import type { DB } from "@/shared/api/database";
import { readAllPages } from "@/shared/api/readAllPages";
import { monthStart, nextMonthStart } from "@/shared/utils/monthRange";
import type {
  AdjustmentRow,
  ExcuseStatusRow,
  HolidayRow,
  MemberWageRateRow,
} from "@/entities/payroll/api/payroll.dto";
import type { PayrollMonth } from "@/entities/payroll/model/payroll.type";
import {
  toAdjustment,
  toExcuseStatus,
  toHoliday,
  toMemberWageRate,
} from "@/entities/payroll/utils/payroll.mapper";

const WAGE_RATE_COLUMNS = [
  "profile_id",
  "effective_date",
  "amount",
  "follows_default",
].join(", ");

const ADJUSTMENT_COLUMNS = [
  "id",
  "day_id",
  "profile_id",
  "minutes",
  "adjusted_at",
].join(", ");

const EXCUSE_STATUS_COLUMNS = [
  "day_id",
  "profile_id",
  "submitted_at",
  "decided_at",
  "decision",
].join(", ");

const HOLIDAY_COLUMNS = ["holiday_date", "source", "name"].join(", ");

function afterWageRate(after: MemberWageRateRow): string {
  return `profile_id.gt.${after.profile_id},and(profile_id.eq.${after.profile_id},effective_date.gt.${after.effective_date})`;
}

function byDateThenProfile(
  left: MemberWageRateRow,
  right: MemberWageRateRow,
): number {
  const leftKey = `${left.effective_date}|${left.profile_id}`;
  const rightKey = `${right.effective_date}|${right.profile_id}`;
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
}

async function monthDayIds(client: DB, month: string): Promise<string[]> {
  const { data, error } = await client
    .from("days")
    .select("id")
    .gte("work_date", monthStart(month))
    .lt("work_date", nextMonthStart(month))
    .returns<{ id: string }[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map((day) => day.id);
}

export async function getPayrollMonth(
  client: DB,
  month: string,
): Promise<PayrollMonth> {
  const dayIds = await monthDayIds(client, month);

  const [wageRates, adjustments, excuseStatus, holidays] = await Promise.all([
    readAllPages(
      (after: MemberWageRateRow | null, limit) => {
        const query = client
          .from("wage_rates")
          .select(WAGE_RATE_COLUMNS)
          .lt("effective_date", nextMonthStart(month));
        return (after === null ? query : query.or(afterWageRate(after)))
          .order("profile_id")
          .order("effective_date")
          .limit(limit)
          .returns<MemberWageRateRow[]>();
      },
      (row) => row,
    ),
    client
      .from("adjustments")
      .select(ADJUSTMENT_COLUMNS)
      .in("day_id", dayIds)
      .returns<AdjustmentRow[]>(),
    client
      .from("excuse_status")
      .select(EXCUSE_STATUS_COLUMNS)
      .in("day_id", dayIds)
      .returns<ExcuseStatusRow[]>(),
    client
      .from("holidays")
      .select(HOLIDAY_COLUMNS)
      .gte("holiday_date", monthStart(month))
      .lt("holiday_date", nextMonthStart(month))
      .returns<HolidayRow[]>(),
  ]);

  if (adjustments.error) {
    throw adjustments.error;
  }
  if (excuseStatus.error) {
    throw excuseStatus.error;
  }
  if (holidays.error) {
    throw holidays.error;
  }

  return {
    wageRates: wageRates.sort(byDateThenProfile).map(toMemberWageRate),
    adjustments: (adjustments.data ?? []).map(toAdjustment),
    excuseStatus: (excuseStatus.data ?? []).map(toExcuseStatus),
    holidays: (holidays.data ?? []).map(toHoliday),
  };
}
