export type MemberWageRateRow = {
  profile_id: string;
  effective_date: string;
  amount: number;
  follows_default: boolean;
};

export type DefaultWageRateRow = {
  effective_date: string;
  amount: number;
};

export type WageRates = {
  wageRates: MemberWageRateRow[];
  defaultWageRate: DefaultWageRateRow | null;
};

export type AdjustmentRow = {
  id: string;
  day_id: string;
  profile_id: string;
  minutes: number;
  adjusted_at: string;
};

export type ExcuseStatusRow = {
  day_id: string;
  profile_id: string;
  submitted_at: string;
  decided_at: string | null;
  decision: string | null;
};

export type HolidayRow = {
  holiday_date: string;
  source: string;
  name: string | null;
};

export type PayrollMonth = {
  wageRates: MemberWageRateRow[];
  adjustments: AdjustmentRow[];
  excuseStatus: ExcuseStatusRow[];
  holidays: HolidayRow[];
};
