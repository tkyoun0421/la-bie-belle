import { randomUUID } from "node:crypto";
import type { Database } from "@/shared/api/database";
import { getPayrollMonth } from "@/entities/payroll/dals/get-payroll-month";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  kstDate,
  kstMonthStart,
  withFreshMonth,
  type AdminUser,
} from "@tests/integration/postgres";

type FunctionName = keyof Database["public"]["Functions"];

async function rpcOrThrow<Name extends FunctionName>(
  admin: AdminUser,
  fn: Name,
  args: Database["public"]["Functions"][Name]["Args"],
): Promise<void> {
  const { error } = await admin.client.rpc(fn, args);
  if (error) {
    throw error;
  }
}

type SeededMonth = { month: string; dayId: string; workDate: string };

async function seedOpenDayInFreshMonth(admin: AdminUser): Promise<SeededMonth> {
  return withFreshMonth(async (monthsFromNow) => {
    const workDate = kstMonthStart(monthsFromNow);
    await rpcOrThrow(admin, "create_schedule", {
      p_month: workDate,
      p_deadline: kstDate(1),
    });
    await rpcOrThrow(admin, "open_day", { p_work_date: workDate });

    const { data, error } = await admin.client
      .from("days")
      .select("id")
      .eq("work_date", workDate)
      .single<{ id: string }>();
    if (error || !data) {
      throw error ?? new Error("연 날을 못 찾았다");
    }
    return { month: workDate.slice(0, 7), dayId: data.id, workDate };
  });
}

/** `"2027-05"`나 `"2027-05-01"`이 오면 `"2027-05-31"`을 낸다. */
function monthEndOf(month: string): string {
  const [year, monthNumber] = month.slice(0, 7).split("-").map(Number);
  const end = new Date(Date.UTC(year, monthNumber, 0));
  return end.toISOString().slice(0, 10);
}

/** `monthEndOf`의 다음 날 — 그 달을 벗어난 첫 날짜다. */
function firstDayAfter(month: string): string {
  const [year, monthNumber] = month.slice(0, 7).split("-").map(Number);
  const next = new Date(Date.UTC(year, monthNumber, 1));
  return next.toISOString().slice(0, 10);
}

function seedWageRate(
  profileId: string,
  effectiveDate: string,
  amount: number,
  followsDefault: boolean,
): void {
  execSql(
    "insert into public.wage_rates (profile_id, effective_date, amount, follows_default)\n" +
      `values (:'profile_id', :'effective_date', :'amount', ${followsDefault ? "true" : "false"});\n`,
    {
      profile_id: profileId,
      effective_date: effectiveDate,
      amount: String(amount),
    },
  );
}

function seedAdjustment(
  dayId: string,
  profileId: string,
  adjustedBy: string,
  minutes: number,
): string {
  const id = randomUUID();
  execSql(
    "insert into public.adjustments (id, day_id, profile_id, minutes, reason, adjusted_by)\n" +
      "values (:'id', :'day_id', :'profile_id', :'minutes', '테스트 조정', :'adjusted_by');\n",
    {
      id,
      day_id: dayId,
      profile_id: profileId,
      minutes: String(minutes),
      adjusted_by: adjustedBy,
    },
  );
  return id;
}

function seedExcuse(dayId: string, profileId: string): void {
  const id = randomUUID();
  execSql(
    "insert into public.excuses (id, day_id, profile_id, body, submitted_at)\n" +
      "values (:'id', :'day_id', :'profile_id', '테스트 사유', now());\n",
    { id, day_id: dayId, profile_id: profileId },
  );
}

type HolidaySource = "api" | "manual";

type HolidayRow = {
  holiday_date: string;
  source: HolidaySource;
  name: string | null;
};

type PayrollMonthWithHolidays = { holidays: HolidayRow[] };

/** 지금 `getPayrollMonth`는 `holidays`를 안 실으니 이 캐스트가 런타임에 `undefined`를 낸다. */
function holidaysOf(result: unknown): HolidayRow[] {
  return (result as PayrollMonthWithHolidays).holidays;
}

/** 달마다 임의로 멀리 떨어뜨려 다른 테스트가 심은 공휴일과 안 겹치게 한다. */
function freshMonth(): string {
  return kstMonthStart(24 + Math.floor(Math.random() * 90000));
}

const seededHolidays: { date: string; source: HolidaySource }[] = [];

function seedHoliday(date: string, source: HolidaySource): void {
  execSql(
    "insert into public.holidays (holiday_date, source, name)\n" +
      "values (:'holiday_date', :'source', '테스트 공휴일')\n" +
      "on conflict (holiday_date, source) do nothing;\n",
    { holiday_date: date, source },
  );
  seededHolidays.push({ date, source });
}

function dayOfMonth(month: string, day: string): string {
  return `${month.slice(0, 7)}-${day}`;
}

/** `month`가 `"2027-05"`면 `"2027-04-30"` — 전달 마지막 날이다. */
function lastDayOfMonthBefore(month: string): string {
  const [year, monthNumber] = month.slice(0, 7).split("-").map(Number);
  const end = new Date(Date.UTC(year, monthNumber - 1, 0));
  return end.toISOString().slice(0, 10);
}

describe("getPayrollMonth(plan AC-07) — wage_rates·adjustments·excuse_status를 그 달치로 읽는다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("wage_rates는 그 달 끝일까지의 이력 전체를 주고, 다음 달로 넘어간 행은 안 준다", async () => {
    const worker = await createApprovedUser();
    const { month } = await seedOpenDayInFreshMonth(admin);
    const beforeMonthStart = kstDate(-400);
    const monthEnd = monthEndOf(month);
    const nextMonthStart = firstDayAfter(month);
    seedWageRate(worker.profileId, beforeMonthStart, 11000, false);
    seedWageRate(worker.profileId, monthEnd, 12000, false);
    seedWageRate(worker.profileId, nextMonthStart, 13000, false);

    const result = await getPayrollMonth(admin.client, month);
    const own = result.wageRates.filter(
      (row) => row.profile_id === worker.profileId,
    );

    expect(own.some((row) => row.effective_date === beforeMonthStart)).toBe(
      true,
    );
    expect(own.some((row) => row.effective_date === monthEnd)).toBe(true);
    expect(own.some((row) => row.effective_date === nextMonthStart)).toBe(
      false,
    );
  });

  it("근무자 세션은 자기 wage_rates만 오고, 관리자 세션은 전원이 온다", async () => {
    const { month } = await seedOpenDayInFreshMonth(admin);
    const workerA = await createApprovedUser();
    const workerB = await createApprovedUser();
    const effectiveDate = kstDate(-30);
    seedWageRate(workerA.profileId, effectiveDate, 11000, false);
    seedWageRate(workerB.profileId, effectiveDate, 12000, false);

    const ownResult = await getPayrollMonth(workerA.client, month);
    expect(
      ownResult.wageRates.some((row) => row.profile_id === workerA.profileId),
    ).toBe(true);
    expect(
      ownResult.wageRates.some((row) => row.profile_id === workerB.profileId),
    ).toBe(false);

    const adminResult = await getPayrollMonth(admin.client, month);
    expect(
      adminResult.wageRates.some((row) => row.profile_id === workerA.profileId),
    ).toBe(true);
    expect(
      adminResult.wageRates.some((row) => row.profile_id === workerB.profileId),
    ).toBe(true);
  });

  it("adjustments는 그 달 날짜의 것만 온다", async () => {
    const worker = await createApprovedUser();
    const inMonth = await seedOpenDayInFreshMonth(admin);
    const outsideMonth = await seedOpenDayInFreshMonth(admin);
    const insideId = seedAdjustment(
      inMonth.dayId,
      worker.profileId,
      admin.profileId,
      30,
    );
    const outsideId = seedAdjustment(
      outsideMonth.dayId,
      worker.profileId,
      admin.profileId,
      30,
    );

    const result = await getPayrollMonth(admin.client, inMonth.month);

    expect(result.adjustments.some((row) => row.id === insideId)).toBe(true);
    expect(result.adjustments.some((row) => row.id === outsideId)).toBe(false);
  });

  it("excuseStatus는 그 달 날짜의 것만 온다", async () => {
    const worker = await createApprovedUser();
    const inMonth = await seedOpenDayInFreshMonth(admin);
    const outsideMonth = await seedOpenDayInFreshMonth(admin);
    seedExcuse(inMonth.dayId, worker.profileId);
    seedExcuse(outsideMonth.dayId, worker.profileId);

    const result = await getPayrollMonth(admin.client, inMonth.month);

    expect(
      result.excuseStatus.some((row) => row.day_id === inMonth.dayId),
    ).toBe(true);
    expect(
      result.excuseStatus.some((row) => row.day_id === outsideMonth.dayId),
    ).toBe(false);
  });
});

describe("getPayrollMonth(plan AC-01) — holidays도 그달치로 같이 싣는다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  afterEach(() => {
    while (seededHolidays.length > 0) {
      const seeded = seededHolidays.pop();
      if (!seeded) {
        continue;
      }
      execSql(
        "delete from public.holidays where holiday_date = :'holiday_date' and source = :'source';\n",
        { holiday_date: seeded.date, source: seeded.source },
      );
    }
  });

  it("그 달의 api 행과 manual 행이 둘 다 온다 — 날짜와 source가 그대로", async () => {
    const month = freshMonth();
    const apiDate = dayOfMonth(month, "10");
    const manualDate = dayOfMonth(month, "15");
    seedHoliday(apiDate, "api");
    seedHoliday(manualDate, "manual");

    const result = await getPayrollMonth(admin.client, month);
    const holidays = holidaysOf(result);

    expect(
      holidays.some(
        (row) => row.holiday_date === apiDate && row.source === "api",
      ),
    ).toBe(true);
    expect(
      holidays.some(
        (row) => row.holiday_date === manualDate && row.source === "manual",
      ),
    ).toBe(true);
  });

  it("범위 밖이 안 섞인다 — 전달 마지막 날과 다음 달 첫날은 안 온다", async () => {
    const month = freshMonth();
    const lastDayOfPrevMonth = lastDayOfMonthBefore(month);
    const firstDayOfNextMonth = firstDayAfter(month);
    seedHoliday(lastDayOfPrevMonth, "api");
    seedHoliday(firstDayOfNextMonth, "api");

    const result = await getPayrollMonth(admin.client, month);
    const holidays = holidaysOf(result);

    expect(
      holidays.some((row) => row.holiday_date === lastDayOfPrevMonth),
    ).toBe(false);
    expect(
      holidays.some((row) => row.holiday_date === firstDayOfNextMonth),
    ).toBe(false);
  });

  it("같은 날짜에 api와 manual이 공존하면 두 행이 다 온다", async () => {
    const month = freshMonth();
    const date = dayOfMonth(month, "10");
    seedHoliday(date, "api");
    seedHoliday(date, "manual");

    const result = await getPayrollMonth(admin.client, month);
    const holidays = holidaysOf(result)
      .filter((row) => row.holiday_date === date)
      .map((row) => row.source)
      .sort();

    expect(holidays).toEqual(["api", "manual"]);
  });

  it("그 달에 공휴일이 하나도 없으면 빈 배열이다", async () => {
    const month = freshMonth();

    const result = await getPayrollMonth(admin.client, month);
    const holidays = holidaysOf(result);

    expect(holidays).toEqual([]);
  });
});
