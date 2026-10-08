export type DayKind = "normal" | "overtime" | "absent";

export type WageRate = {
  effectiveDate: string;
  amount: number;
};

export type MemberWageRate = WageRate & {
  profileId: string;
  followsDefault: boolean;
};

export type Adjustment = {
  id: string;
  dayId: string;
  profileId: string;
  minutes: number;
  adjustedAt: string;
};

export type ExcuseStatus = {
  dayId: string;
  profileId: string;
  submittedAt: string;
  decidedAt: string | null;
  decision: string | null;
};

export type Holiday = {
  holidayDate: string;
  source: string;
  name: string | null;
};

export type WageRates = {
  wageRates: MemberWageRate[];
  defaultWageRate: WageRate | null;
};

export type PayrollMonth = {
  wageRates: MemberWageRate[];
  adjustments: Adjustment[];
  excuseStatus: ExcuseStatus[];
  holidays: Holiday[];
};
