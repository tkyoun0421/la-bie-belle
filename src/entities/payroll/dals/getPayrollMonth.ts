import type { DB } from "@/shared/api/database";

/**
 * 그 달 급여의 재료 넷이다 — 시급 이력, 조정, 사유 상태, 공휴일. 배정과 날은 `['schedule']`이고
 * 리허설은 `['rehearsal']`이라 화면이 세 키를 읽어 계산에 넣는다
 * (`docs/2-design/modules/payroll/design.md`의 「급여는 계산한다」).
 *
 * **시급은 그 달 끝일까지 전부 준다.** 그달에 시작한 행만 주면 지난달에 정해진 시급으로 일한
 * 날의 금액을 못 낸다 — 계산이 `effective_date <= 그날` 중 가장 늦은 행을 고르므로 과거
 * 이력이 통째로 있어야 한다.
 *
 * **관리자인지를 코드가 안 나눈다.** RLS가 `wage_rates`를 「본인 행과 관리자 전원」으로
 * 이미 갈라(PAY-018) 같은 질의가 근무자에게는 자기 행만, 관리자에게는 전원을 낸다.
 *
 * **날 묶음을 먼저 읽는다.** `adjustments`와 `excuse_status`가 날짜를 안 들고 `day_id`만
 * 들어서, 그 달의 날을 먼저 집어 그 묶음으로 좁힌다.
 *
 * **공휴일은 날을 안 거친다.** 근무를 안 여는 날에도 행이 서서 `holiday_date`로 바로 자른다.
 * 같은 날짜에 `api` 행과 `manual` 행이 같이 설 수 있어 둘을 합치지 않고 그대로 준다 — 잠금
 * 판정이 `api`의 유무만 본다(`docs/2-design/modules/payroll/design.md`의 「공휴일」).
 */

export type WageRateRow = {
  profile_id: string;
  effective_date: string;
  amount: number;
  follows_default: boolean;
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
  wageRates: WageRateRow[];
  adjustments: AdjustmentRow[];
  excuseStatus: ExcuseStatusRow[];
  holidays: HolidayRow[];
};

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

/** `"2026-12"`도 `"2026-12-25"`도 `"2026-12-01"`이다. */
function monthStart(month: string): string {
  return `${month.slice(0, 7)}-01`;
}

/** `"2026-12"`의 다음은 `"2027-01-01"`이다. */
function nextMonthStart(month: string): string {
  const [year, index] = month.slice(0, 7).split("-").map(Number);
  const rolls = index === 12;

  return [
    String(rolls ? year + 1 : year).padStart(4, "0"),
    String(rolls ? 1 : index + 1).padStart(2, "0"),
    "01",
  ].join("-");
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
    client
      .from("wage_rates")
      .select(WAGE_RATE_COLUMNS)
      .lt("effective_date", nextMonthStart(month))
      .returns<WageRateRow[]>(),
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
