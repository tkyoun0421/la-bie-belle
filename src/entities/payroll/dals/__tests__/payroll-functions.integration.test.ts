import {
  createAdminUser,
  createApprovedUser,
  createSubmittedUser,
  execSql,
  kstDate,
  kstMonthStart,
  seedAssignment,
  withFreshMonth,
  type AdminUser,
} from "@tests/integration/postgres";

type RpcCaller = { client: AdminUser["client"] };
type RpcOutcome = { data: unknown; error: { message: string } | null };

function rpc(
  user: RpcCaller,
  fn: string,
  args: Record<string, unknown>,
): Promise<RpcOutcome> {
  return (
    user.client as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<RpcOutcome>;
    }
  ).rpc(fn, args);
}

type QueryResult<T> = { data: T[] | null; error: { message: string } | null };
type SingleResult<T> = { data: T | null; error: { message: string } | null };

/**
 * 아직 생성 타입에 없는 표를 읽는 최소한의 체이닝 타입이다 — `wage_rates`·
 * `default_wage_rates`·`adjustments`·`holidays`는 이 task가 아직 마이그레이션을 안 낸
 * 표라 `Db`가 모른다. 실제 supabase-js 빌더처럼 체이닝도 되고 그대로 await도 된다.
 */
type Query<T> = Promise<QueryResult<T>> & {
  eq: (column: string, value: string) => Query<T>;
  gte: (column: string, value: string) => Query<T>;
  lt: (column: string, value: string) => Query<T>;
  order: (column: string) => Query<T>;
  maybeSingle: () => Promise<SingleResult<T>>;
};

function selectFrom<T>(
  user: RpcCaller,
  table: string,
  columns: string,
): Query<T> {
  return (
    user.client as unknown as {
      from: (table: string) => { select: (columns: string) => Query<T> };
    }
  )
    .from(table)
    .select(columns);
}

async function rpcOrThrow(
  user: RpcCaller,
  fn: string,
  args: Record<string, unknown>,
): Promise<void> {
  const { error } = await rpc(user, fn, args);
  if (error) {
    throw new Error(error.message);
  }
}

function freshPastDate(): string {
  return kstDate(-(24 + Math.floor(Math.random() * 90000)));
}

function freshHolidayYear(): number {
  return 2050 + Math.floor(Math.random() * 900);
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

function seedDefaultWageRate(effectiveDate: string, amount: number): void {
  execSql(
    "insert into public.default_wage_rates (effective_date, amount)\n" +
      "values (:'effective_date', :'amount')\n" +
      "on conflict (effective_date) do update set amount = excluded.amount;\n",
    { effective_date: effectiveDate, amount: String(amount) },
  );
}

function seedHolidayRow(holidayDate: string, source: "api" | "manual"): void {
  execSql(
    "insert into public.holidays (holiday_date, source, name)\n" +
      "values (:'holiday_date', :'source', '테스트 공휴일')\n" +
      "on conflict (holiday_date, source) do nothing;\n",
    { holiday_date: holidayDate, source },
  );
}

function callImportHolidays(
  year: number,
  rows: Array<{ holiday_date: string; name: string }>,
): void {
  execSql(
    "select internal.import_holidays(:'year'::integer, :'rows'::jsonb);\n",
    {
      year: String(year),
      rows: JSON.stringify(rows),
    },
  );
}

async function wageRateRow(
  admin: AdminUser,
  profileId: string,
  effectiveDate: string,
): Promise<{ amount: number; follows_default: boolean } | null> {
  const { data, error } = await selectFrom<{
    amount: number;
    follows_default: boolean;
  }>(admin, "wage_rates", "amount, follows_default")
    .eq("profile_id", profileId)
    .eq("effective_date", effectiveDate)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function wageRateRows(
  admin: AdminUser,
  profileId: string,
): Promise<Array<{ effective_date: string; amount: number }>> {
  const { data, error } = await selectFrom<{
    effective_date: string;
    amount: number;
  }>(admin, "wage_rates", "effective_date, amount").eq("profile_id", profileId);
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

async function defaultWageRateAmount(
  admin: AdminUser,
  effectiveDate: string,
): Promise<number | null> {
  const { data, error } = await selectFrom<{ amount: number }>(
    admin,
    "default_wage_rates",
    "amount",
  )
    .eq("effective_date", effectiveDate)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data?.amount ?? null;
}

async function adjustmentRows(
  admin: AdminUser,
  dayId: string,
  profileId: string,
): Promise<Array<{ minutes: number; adjusted_at: string }>> {
  const { data, error } = await selectFrom<{
    minutes: number;
    adjusted_at: string;
  }>(admin, "adjustments", "minutes, adjusted_at")
    .eq("day_id", dayId)
    .eq("profile_id", profileId)
    .order("adjusted_at");
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

async function holidayRows(
  admin: AdminUser,
  holidayDate: string,
): Promise<Array<{ source: string }>> {
  const { data, error } = await selectFrom<{ source: string }>(
    admin,
    "holidays",
    "source",
  ).eq("holiday_date", holidayDate);
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

async function holidayRowsInYear(
  admin: AdminUser,
  year: number,
  source: "api" | "manual",
): Promise<string[]> {
  const { data, error } = await selectFrom<{ holiday_date: string }>(
    admin,
    "holidays",
    "holiday_date",
  )
    .eq("source", source)
    .gte("holiday_date", `${year}-01-01`)
    .lt("holiday_date", `${year + 1}-01-01`);
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => row.holiday_date);
}

async function seedOpenDay(admin: AdminUser): Promise<{ dayId: string }> {
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
    return { dayId: data.id };
  });
}

describe("set_wage(plan AC-03) — 개인 시급을 오늘 날짜로 upsert한다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("100,000원은 통과한다", async () => {
    const worker = await createApprovedUser();

    const { error } = await rpc(admin, "set_wage", {
      p_profile_id: worker.profileId,
      p_amount: 100000,
    });

    expect(error).toBeNull();
    const row = await wageRateRow(admin, worker.profileId, kstDate(0));
    expect(row).toEqual({ amount: 100000, follows_default: false });
  });

  it("100,001원이면 bad_amount", async () => {
    const worker = await createApprovedUser();

    const { error } = await rpc(admin, "set_wage", {
      p_profile_id: worker.profileId,
      p_amount: 100001,
    });

    expect(error?.message).toBe("bad_amount");
  });

  it("0원이면 bad_amount", async () => {
    const worker = await createApprovedUser();

    const { error } = await rpc(admin, "set_wage", {
      p_profile_id: worker.profileId,
      p_amount: 0,
    });

    expect(error?.message).toBe("bad_amount");
  });

  it("같은 날 두 번 바꾸면 행이 하나고 값은 나중 것이다(PAY-011)", async () => {
    const worker = await createApprovedUser();

    await rpcOrThrow(admin, "set_wage", {
      p_profile_id: worker.profileId,
      p_amount: 11000,
    });
    await rpcOrThrow(admin, "set_wage", {
      p_profile_id: worker.profileId,
      p_amount: 13000,
    });

    const rows = await wageRateRows(admin, worker.profileId);
    const today = kstDate(0);
    const todayRows = rows.filter((row) => row.effective_date === today);
    expect(todayRows).toEqual([{ effective_date: today, amount: 13000 }]);
  });

  it("관리자가 아니면 not_allowed", async () => {
    const worker = await createApprovedUser();
    const other = await createApprovedUser();

    const { error } = await rpc(worker, "set_wage", {
      p_profile_id: other.profileId,
      p_amount: 11000,
    });

    expect(error?.message).toBe("not_allowed");
  });
});

describe("reset_wage_to_default(plan AC-03) — 오늘 날짜에 그 시점 기본값으로 되돌린다(PAY-014)", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("되돌린 날 행의 금액이 그 시점 기본값이고 follows_default가 true다", async () => {
    const worker = await createApprovedUser();
    seedWageRate(worker.profileId, freshPastDate(), 20000, false);
    seedDefaultWageRate(kstDate(0), 15000);

    const { error } = await rpc(admin, "reset_wage_to_default", {
      p_profile_id: worker.profileId,
    });

    expect(error).toBeNull();
    const row = await wageRateRow(admin, worker.profileId, kstDate(0));
    expect(row).toEqual({ amount: 15000, follows_default: true });
  });

  it("관리자가 아니면 not_allowed", async () => {
    const worker = await createApprovedUser();

    const { error } = await rpc(worker, "reset_wage_to_default", {
      p_profile_id: worker.profileId,
    });

    expect(error?.message).toBe("not_allowed");
  });
});

describe("set_default_wage(plan AC-03) — 따르는 사람 전원에게 오늘 행이 같이 선다(PAY-013)", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("100,001원이면 bad_amount고, 따르는 사람에게도 오늘 행이 안 선다", async () => {
    const follower = await createApprovedUser();
    seedWageRate(follower.profileId, freshPastDate(), 10000, true);

    const { error } = await rpc(admin, "set_default_wage", {
      p_amount: 100001,
    });

    expect(error?.message).toBe("bad_amount");
    const row = await wageRateRow(admin, follower.profileId, kstDate(0));
    expect(row).toBeNull();
  });

  it("가장 최근 행이 follows_default=true인 사람만 오늘 행이 선다", async () => {
    const follower = await createApprovedUser();
    seedWageRate(follower.profileId, freshPastDate(), 10000, true);

    const individual = await createApprovedUser();
    seedWageRate(individual.profileId, freshPastDate(), 12000, false);

    const amount = 16000 + Math.floor(Math.random() * 1000);
    const { error } = await rpc(admin, "set_default_wage", {
      p_amount: amount,
    });

    expect(error).toBeNull();
    const today = kstDate(0);
    expect(await wageRateRow(admin, follower.profileId, today)).toEqual({
      amount,
      follows_default: true,
    });
    expect(await wageRateRow(admin, individual.profileId, today)).toBeNull();
    expect(await defaultWageRateAmount(admin, today)).toBe(amount);
  });

  it("과거에 따랐지만 지금은 개별로 정한 사람은 제외된다", async () => {
    const switched = await createApprovedUser();
    const earlier = kstDate(-(200 + Math.floor(Math.random() * 90000)));
    const laterButPast = kstDate(-(1 + Math.floor(Math.random() * 100)));
    seedWageRate(switched.profileId, earlier, 10000, true);
    seedWageRate(switched.profileId, laterButPast, 14000, false);

    const amount = 21000 + Math.floor(Math.random() * 1000);
    await rpcOrThrow(admin, "set_default_wage", { p_amount: amount });

    const row = await wageRateRow(admin, switched.profileId, kstDate(0));
    expect(row).toBeNull();
  });

  it("관리자가 아니면 not_allowed", async () => {
    const worker = await createApprovedUser();

    const { error } = await rpc(worker, "set_default_wage", {
      p_amount: 11000,
    });

    expect(error?.message).toBe("not_allowed");
  });
});

describe("set_adjustment(plan AC-04) — 새 행을 넣는다. 덮어쓰지 않는다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("그날 그 사람의 살아 있는 배정이 없으면 not_allowed", async () => {
    const worker = await createApprovedUser();
    const { dayId } = await seedOpenDay(admin);

    const { error } = await rpc(admin, "set_adjustment", {
      p_day_id: dayId,
      p_profile_id: worker.profileId,
      p_minutes: 30,
      p_reason: "연장",
    });

    expect(error?.message).toBe("not_allowed");
  });

  it("두 번 부르면 행이 둘이고 마지막 행이 나중 값이다(이력)", async () => {
    const worker = await createApprovedUser();
    const { dayId } = await seedOpenDay(admin);
    seedAssignment(dayId, worker.profileId, "regular");

    await rpcOrThrow(admin, "set_adjustment", {
      p_day_id: dayId,
      p_profile_id: worker.profileId,
      p_minutes: 30,
      p_reason: "연장",
    });
    await rpcOrThrow(admin, "set_adjustment", {
      p_day_id: dayId,
      p_profile_id: worker.profileId,
      p_minutes: -540,
      p_reason: "결근",
    });

    const rows = await adjustmentRows(admin, dayId, worker.profileId);
    expect(rows).toHaveLength(2);
    expect(rows[1]?.minutes).toBe(-540);
  });

  it("p_minutes = 0도 새 행이다 — 원래대로도 지우지 않는다", async () => {
    const worker = await createApprovedUser();
    const { dayId } = await seedOpenDay(admin);
    seedAssignment(dayId, worker.profileId, "regular");
    await rpcOrThrow(admin, "set_adjustment", {
      p_day_id: dayId,
      p_profile_id: worker.profileId,
      p_minutes: -540,
      p_reason: "결근",
    });

    await rpcOrThrow(admin, "set_adjustment", {
      p_day_id: dayId,
      p_profile_id: worker.profileId,
      p_minutes: 0,
      p_reason: "원래대로",
    });

    const rows = await adjustmentRows(admin, dayId, worker.profileId);
    expect(rows).toHaveLength(2);
    expect(rows[1]?.minutes).toBe(0);
  });

  it("관리자가 아니면 not_allowed", async () => {
    const worker = await createApprovedUser();
    const { dayId } = await seedOpenDay(admin);
    seedAssignment(dayId, worker.profileId, "regular");

    const { error } = await rpc(worker, "set_adjustment", {
      p_day_id: dayId,
      p_profile_id: worker.profileId,
      p_minutes: 30,
      p_reason: "연장",
    });

    expect(error?.message).toBe("not_allowed");
  });
});

describe("import_holidays(plan AC-05) — internal, 그 해 api 행만 갈아치운다", () => {
  it("api 행이 새 목록으로 완전히 교체된다", async () => {
    const admin = await createAdminUser();
    const year = freshHolidayYear();
    callImportHolidays(year, [{ holiday_date: `${year}-02-01`, name: "이전" }]);

    callImportHolidays(year, [{ holiday_date: `${year}-03-01`, name: "새것" }]);

    const apiDates = await holidayRowsInYear(admin, year, "api");
    expect(apiDates).toEqual([`${year}-03-01`]);
  });

  it("manual 행은 재수입에도 남는다", async () => {
    const admin = await createAdminUser();
    const year = freshHolidayYear();
    seedHolidayRow(`${year}-01-01`, "manual");

    callImportHolidays(year, [{ holiday_date: `${year}-03-01`, name: "새것" }]);

    const manualDates = await holidayRowsInYear(admin, year, "manual");
    expect(manualDates).toEqual([`${year}-01-01`]);
  });

  it("빈 배열이면 기존 api 행이 그대로다", async () => {
    const admin = await createAdminUser();
    const year = freshHolidayYear();
    callImportHolidays(year, [{ holiday_date: `${year}-05-01`, name: "기존" }]);

    callImportHolidays(year, []);

    const apiDates = await holidayRowsInYear(admin, year, "api");
    expect(apiDates).toEqual([`${year}-05-01`]);
  });

  it("internal 스키마라 public.rpc('import_holidays')로는 안 잡힌다", async () => {
    const admin = await createAdminUser();
    const year = freshHolidayYear();

    expect(() =>
      callImportHolidays(year, [
        { holiday_date: `${year}-06-01`, name: "내부" },
      ]),
    ).not.toThrow();

    const { error } = await rpc(admin, "import_holidays", {
      p_year: year,
      p_rows: [{ holiday_date: `${year}-07-01`, name: "공개호출" }],
    });

    expect(error).not.toBeNull();
  });
});

describe("set_holiday(plan AC-05) — public, 참이면 manual 행, 거짓이면 삭제", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("p_on=true면 manual 행이 선다", async () => {
    const date = freshPastDate();

    await rpcOrThrow(admin, "set_holiday", { p_date: date, p_on: true });

    expect(await holidayRows(admin, date)).toEqual([{ source: "manual" }]);
  });

  it("p_on=false면 manual 행이 지워진다", async () => {
    const date = freshPastDate();
    await rpcOrThrow(admin, "set_holiday", { p_date: date, p_on: true });

    await rpcOrThrow(admin, "set_holiday", { p_date: date, p_on: false });

    expect(await holidayRows(admin, date)).toEqual([]);
  });

  it("같은 날짜에 api 행이 있으면 참이어도 무변화다", async () => {
    const date = freshPastDate();
    seedHolidayRow(date, "api");

    await rpcOrThrow(admin, "set_holiday", { p_date: date, p_on: true });

    expect(await holidayRows(admin, date)).toEqual([{ source: "api" }]);
  });

  it("관리자가 아니면 not_allowed", async () => {
    const worker = await createApprovedUser();
    const date = freshPastDate();

    const { error } = await rpc(worker, "set_holiday", {
      p_date: date,
      p_on: true,
    });

    expect(error?.message).toBe("not_allowed");
  });
});

describe("승인 함수가 첫 wage_rates 행을 넣는다(plan AC-03 마지막 줄)", () => {
  it("approve_member로 승인되면 오늘 날짜의 follows_default=true 행이 선다", async () => {
    const admin = await createAdminUser();
    const applicant = await createSubmittedUser();
    seedDefaultWageRate(kstDate(0), 12000);

    const { error } = await admin.client.rpc("approve_member", {
      profile_id: applicant.profileId,
    });

    expect(error).toBeNull();
    const row = await wageRateRow(admin, applicant.profileId, kstDate(0));
    expect(row).toEqual({ amount: 12000, follows_default: true });
  });
});
