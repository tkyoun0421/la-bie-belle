import type { DB } from "@/shared/api/database";
import { monthStart, nextMonthStart } from "@/shared/utils/monthRange";
import type {
  AdjustmentRow,
  ExcuseStatusRow,
  HolidayRow,
  MemberWageRateRow,
  PayrollMonth,
} from "@/entities/payroll/api/payroll.dto";

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
    client
      .from("wage_rates")
      .select(WAGE_RATE_COLUMNS)
      .lt("effective_date", nextMonthStart(month))
      .returns<MemberWageRateRow[]>(),
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

  if (wageRates.error) {
    throw wageRates.error;
  }
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
    wageRates: wageRates.data ?? [],
    adjustments: adjustments.data ?? [],
    excuseStatus: excuseStatus.data ?? [],
    holidays: holidays.data ?? [],
  };
}
