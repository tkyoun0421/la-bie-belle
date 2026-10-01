/**
 * 급여 질의가 돌려주는 생 꼴이다. 열 이름이 DB 그대로라 `api` 안에 산다.
 *
 * **아직 화면까지 이 꼴이 닿는다.** 매퍼로 도메인 모양으로 바꾸는 일은 묶음 열이 자리를
 * 잡은 뒤 한 번에 한다([dto-to-domain-shape](../../../../docs/3-build/plans/dto-to-domain-shape.md)).
 */

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
