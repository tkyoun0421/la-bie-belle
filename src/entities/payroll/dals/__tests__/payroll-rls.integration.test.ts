import { randomUUID } from "node:crypto";
import {
  createAdminUser,
  createApprovedUser,
  createLeftUser,
  execSql,
  kstDate,
  kstMonthStart,
  withFreshMonth,
  type AdminUser,
} from "@tests/integration/postgres";
import { createSignedInUser } from "@tests/integration/supabase";

type ErrorWithCode = { code?: string } | null;

type TableAccessor<T> = {
  select: (columns: string) => {
    eq: (
      column: string,
      value: string,
    ) => Promise<{ data: T[] | null; error: ErrorWithCode }>;
  };
  insert: (row: Record<string, unknown>) => Promise<{ error: ErrorWithCode }>;
  update: (row: Record<string, unknown>) => {
    eq: (column: string, value: string) => Promise<{ error: ErrorWithCode }>;
  };
  delete: () => {
    eq: (column: string, value: string) => Promise<{ error: ErrorWithCode }>;
  };
};

function tableFor<T>(
  user: { client: unknown },
  table: string,
): TableAccessor<T> {
  return (
    user.client as unknown as { from: (table: string) => TableAccessor<T> }
  ).from(table);
}

function freshPastDate(): string {
  return kstDate(-(24 + Math.floor(Math.random() * 90000)));
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

async function seedOpenDay(admin: AdminUser): Promise<string> {
  return withFreshMonth(async (monthsFromNow) => {
    const workDate = kstMonthStart(monthsFromNow);
    const { error: scheduleError } = await admin.client.rpc("create_schedule", {
      p_month: workDate,
      p_deadline: kstDate(1),
    });
    if (scheduleError) {
      throw scheduleError;
    }
    const { error: openError } = await admin.client.rpc("open_day", {
      p_work_date: workDate,
    });
    if (openError) {
      throw openError;
    }

    const { data, error } = await admin.client
      .from("days")
      .select("id")
      .eq("work_date", workDate)
      .single<{ id: string }>();
    if (error || !data) {
      throw error ?? new Error("연 날을 못 찾았다");
    }
    return data.id;
  });
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

function seedHoliday(holidayDate: string, source: "api" | "manual"): void {
  execSql(
    "insert into public.holidays (holiday_date, source, name)\n" +
      "values (:'holiday_date', :'source', '테스트 공휴일')\n" +
      "on conflict (holiday_date, source) do nothing;\n",
    { holiday_date: holidayDate, source },
  );
}

describe("payroll RLS(plan AC-02) — wage_rates는 본인·관리자만, default_wage_rates는 관리자만, adjustments·holidays는 기본값이다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  describe("wage_rates — 본인 행과 관리자만 읽는다(PAY-018)", () => {
    it("본인은 자기 시급 행을 읽는다", async () => {
      const owner = await createApprovedUser();
      const effectiveDate = freshPastDate();
      seedWageRate(owner.profileId, effectiveDate, 11000, false);

      const { data, error } = await tableFor<{ profile_id: string }>(
        owner,
        "wage_rates",
      )
        .select("profile_id")
        .eq("profile_id", owner.profileId);

      expect(error).toBeNull();
      expect(data).toEqual([{ profile_id: owner.profileId }]);
    });

    it("남의 시급 행은 0행이다", async () => {
      const owner = await createApprovedUser();
      const reader = await createApprovedUser();
      const effectiveDate = freshPastDate();
      seedWageRate(owner.profileId, effectiveDate, 11000, false);

      const { data, error } = await tableFor<{ profile_id: string }>(
        reader,
        "wage_rates",
      )
        .select("profile_id")
        .eq("profile_id", owner.profileId);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("관리자는 전원의 시급 행을 읽는다", async () => {
      const owner = await createApprovedUser();
      const effectiveDate = freshPastDate();
      seedWageRate(owner.profileId, effectiveDate, 11000, false);

      const { data, error } = await tableFor<{ profile_id: string }>(
        admin,
        "wage_rates",
      )
        .select("profile_id")
        .eq("profile_id", owner.profileId);

      expect(error).toBeNull();
      expect(data).toEqual([{ profile_id: owner.profileId }]);
    });
  });

  describe("default_wage_rates — 관리자만 읽는다", () => {
    it("근무자는 기본 시급을 못 읽는다 — 0행", async () => {
      const worker = await createApprovedUser();
      const effectiveDate = freshPastDate();
      seedDefaultWageRate(effectiveDate, 10000);

      const { data, error } = await tableFor<{ effective_date: string }>(
        worker,
        "default_wage_rates",
      )
        .select("effective_date")
        .eq("effective_date", effectiveDate);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("관리자는 기본 시급을 읽는다", async () => {
      const effectiveDate = freshPastDate();
      seedDefaultWageRate(effectiveDate, 10000);

      const { data, error } = await tableFor<{ effective_date: string }>(
        admin,
        "default_wage_rates",
      )
        .select("effective_date")
        .eq("effective_date", effectiveDate);

      expect(error).toBeNull();
      expect(data).toEqual([{ effective_date: effectiveDate }]);
    });
  });

  describe("adjustments — 기본값이다(is_approved) — 그날 명단이 서로 보인다", () => {
    it("승인된 다른 근무자도 그 조정을 읽는다", async () => {
      const owner = await createApprovedUser();
      const reader = await createApprovedUser();
      const dayId = await seedOpenDay(admin);
      const id = seedAdjustment(dayId, owner.profileId, admin.profileId, 30);

      const { data, error } = await tableFor<{ id: string }>(
        reader,
        "adjustments",
      )
        .select("id")
        .eq("id", id);

      expect(error).toBeNull();
      expect(data).toEqual([{ id }]);
    });

    it("승인 안 된 사용자는 0행이다", async () => {
      const owner = await createApprovedUser();
      const unapproved = await createSignedInUser();
      const dayId = await seedOpenDay(admin);
      const id = seedAdjustment(dayId, owner.profileId, admin.profileId, 30);

      const { data, error } = await tableFor<{ id: string }>(
        unapproved,
        "adjustments",
      )
        .select("id")
        .eq("id", id);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("퇴사자는 0행이다", async () => {
      const owner = await createApprovedUser();
      const left = await createLeftUser();
      const dayId = await seedOpenDay(admin);
      const id = seedAdjustment(dayId, owner.profileId, admin.profileId, 30);

      const { data, error } = await tableFor<{ id: string }>(
        left,
        "adjustments",
      )
        .select("id")
        .eq("id", id);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });

  describe("holidays — 기본값이다(is_approved)", () => {
    it("승인된 근무자는 공휴일을 읽는다", async () => {
      const worker = await createApprovedUser();
      const holidayDate = freshPastDate();
      seedHoliday(holidayDate, "manual");

      const { data, error } = await tableFor<{ holiday_date: string }>(
        worker,
        "holidays",
      )
        .select("holiday_date")
        .eq("holiday_date", holidayDate);

      expect(error).toBeNull();
      expect(data).toEqual([{ holiday_date: holidayDate }]);
    });

    it("승인 안 된 사용자는 0행이다", async () => {
      const unapproved = await createSignedInUser();
      const holidayDate = freshPastDate();
      seedHoliday(holidayDate, "manual");

      const { data, error } = await tableFor<{ holiday_date: string }>(
        unapproved,
        "holidays",
      )
        .select("holiday_date")
        .eq("holiday_date", holidayDate);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("퇴사자는 0행이다", async () => {
      const left = await createLeftUser();
      const holidayDate = freshPastDate();
      seedHoliday(holidayDate, "manual");

      const { data, error } = await tableFor<{ holiday_date: string }>(
        left,
        "holidays",
      )
        .select("holiday_date")
        .eq("holiday_date", holidayDate);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });

  describe("표 넷 다 authenticated의 직접 insert/update/delete 권한이 없다", () => {
    it("wage_rates — 근무자가 직접 insert를 못 한다", async () => {
      const worker = await createApprovedUser();

      const { error } = await tableFor(worker, "wage_rates").insert({
        profile_id: worker.profileId,
        effective_date: freshPastDate(),
        amount: 11000,
        follows_default: false,
      });

      expect(error?.code).toBe("42501");
    });

    it("wage_rates — 관리자도 직접 insert를 못 한다", async () => {
      const { error } = await tableFor(admin, "wage_rates").insert({
        profile_id: admin.profileId,
        effective_date: freshPastDate(),
        amount: 11000,
        follows_default: false,
      });

      expect(error?.code).toBe("42501");
    });

    it("wage_rates — 본인도 직접 update를 못 한다", async () => {
      const owner = await createApprovedUser();
      const effectiveDate = freshPastDate();
      seedWageRate(owner.profileId, effectiveDate, 11000, false);

      const { error } = await tableFor(owner, "wage_rates")
        .update({ amount: 12000 })
        .eq("profile_id", owner.profileId);

      expect(error?.code).toBe("42501");
    });

    it("wage_rates — 관리자도 직접 delete를 못 한다", async () => {
      const owner = await createApprovedUser();
      const effectiveDate = freshPastDate();
      seedWageRate(owner.profileId, effectiveDate, 11000, false);

      const { error } = await tableFor(admin, "wage_rates")
        .delete()
        .eq("profile_id", owner.profileId);

      expect(error?.code).toBe("42501");
    });

    it("default_wage_rates — 관리자도 직접 insert를 못 한다", async () => {
      const { error } = await tableFor(admin, "default_wage_rates").insert({
        effective_date: freshPastDate(),
        amount: 10000,
      });

      expect(error?.code).toBe("42501");
    });

    it("adjustments — 관리자도 직접 insert를 못 한다", async () => {
      const owner = await createApprovedUser();
      const dayId = await seedOpenDay(admin);

      const { error } = await tableFor(admin, "adjustments").insert({
        day_id: dayId,
        profile_id: owner.profileId,
        minutes: 30,
        reason: "직접 시도",
        adjusted_by: admin.profileId,
      });

      expect(error?.code).toBe("42501");
    });

    it("holidays — 관리자도 직접 insert를 못 한다", async () => {
      const { error } = await tableFor(admin, "holidays").insert({
        holiday_date: freshPastDate(),
        source: "manual",
        name: "직접 시도",
      });

      expect(error?.code).toBe("42501");
    });
  });
});
