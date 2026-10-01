import type { Database } from "@/shared/api/database";
import { DomainError } from "@/shared/api/errors";
import { submitAvailability } from "@/features/availabilitySubmit/api/submitAvailability.api";
import {
  backdateDeadline,
  createAdminUser,
  createApprovedUser,
  execSql,
  kstDate,
  kstMonthStart,
  withFreshMonth,
  type AdminUser,
  type ApprovedUser,
} from "@tests/integration/postgres";
import {
  createSignedInUser,
  type SignedInUser,
} from "@tests/integration/supabase";

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

function nextMonthStart(monthDate: string): string {
  const [year, month] = monthDate.split("-").map(Number);
  const rolls = month === 12;
  const nextYear = rolls ? year + 1 : year;
  const nextMonth = rolls ? 1 : month + 1;

  return `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-01`;
}

function dayInMonth(monthDate: string, day: number): string {
  return `${monthDate.slice(0, 7)}-${String(day).padStart(2, "0")}`;
}

type SeededSchedule = { month: string; monthDate: string; scheduleId: string };

async function seedSchedule(
  admin: AdminUser,
  deadline: string,
): Promise<SeededSchedule> {
  return withFreshMonth(async (monthsFromNow) => {
    const monthDate = kstMonthStart(monthsFromNow);
    await rpcOrThrow(admin, "create_schedule", {
      p_month: monthDate,
      p_deadline: deadline,
    });

    const { data, error } = await admin.client
      .from("schedules")
      .select("id")
      .eq("month", monthDate)
      .single<{ id: string }>();
    if (error || !data) {
      throw error ?? new Error("만든 근무표를 못 찾았다");
    }

    return { month: monthDate.slice(0, 7), monthDate, scheduleId: data.id };
  });
}

function randomMonthWithoutSchedule(): string {
  const offset = 24 + Math.floor(Math.random() * 90000);
  return kstMonthStart(offset).slice(0, 7);
}

async function availabilityDatesFor(
  admin: AdminUser,
  profileId: string,
  monthDate: string,
): Promise<string[]> {
  const { data, error } = await admin.client
    .from("availabilities")
    .select("work_date")
    .eq("profile_id", profileId)
    .gte("work_date", monthDate)
    .lt("work_date", nextMonthStart(monthDate))
    .order("work_date");
  if (error) {
    throw error;
  }
  return (data ?? []).map((row) => (row as { work_date: string }).work_date);
}

async function captureDomainError(
  run: () => Promise<unknown>,
): Promise<DomainError> {
  try {
    await run();
  } catch (error) {
    if (error instanceof DomainError) {
      return error;
    }
    throw error;
  }
  throw new Error("에러가 나지 않았다");
}

function seedExistingAvailability(profileId: string, workDate: string): void {
  execSql(
    "insert into public.availabilities (profile_id, work_date) values (:'profile_id', :'work_date');\n",
    { profile_id: profileId, work_date: workDate },
  );
}

describe("submitAvailability dal — submit_availability를 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;
  let worker: ApprovedUser;

  beforeAll(async () => {
    admin = await createAdminUser();
    worker = await createApprovedUser();
  });

  describe("코드", () => {
    it("정상 신청은 오류 없이 통과하고 availabilities 행이 생긴다", async () => {
      const { month, monthDate } = await seedSchedule(admin, kstDate(1));
      const date = dayInMonth(monthDate, 1);

      await submitAvailability(worker.client, month, [date]);

      const dates = await availabilityDatesFor(
        admin,
        worker.profileId,
        monthDate,
      );
      expect(dates).toEqual([date]);
    });

    it("승인 안 된 사람이 부르면 not_allowed", async () => {
      const unapproved: SignedInUser = await createSignedInUser();
      const month = randomMonthWithoutSchedule();

      const error = await captureDomainError(() =>
        submitAvailability(unapproved.client, month, [`${month}-01`]),
      );

      expect(error.code).toBe("not_allowed");
    });

    it("그 달 근무표가 없으면 no_schedule", async () => {
      const month = randomMonthWithoutSchedule();

      const error = await captureDomainError(() =>
        submitAvailability(worker.client, month, [`${month}-01`]),
      );

      expect(error.code).toBe("no_schedule");
    });

    it("마감 다음날부터는 window_closed", async () => {
      const { month, monthDate, scheduleId } = await seedSchedule(
        admin,
        kstDate(1),
      );
      backdateDeadline(scheduleId, kstDate(-1));

      const error = await captureDomainError(() =>
        submitAvailability(worker.client, month, [dayInMonth(monthDate, 1)]),
      );

      expect(error.code).toBe("window_closed");
    });

    it("확정된 달은 already_confirmed", async () => {
      const { month, monthDate, scheduleId } = await seedSchedule(
        admin,
        kstDate(1),
      );
      backdateDeadline(scheduleId, kstDate(-1));
      await rpcOrThrow(admin, "confirm_schedule", { p_month: monthDate });

      const error = await captureDomainError(() =>
        submitAvailability(worker.client, month, [dayInMonth(monthDate, 1)]),
      );

      expect(error.code).toBe("already_confirmed");
    });

    it("그 달 밖 날짜가 섞이면 bad_dates", async () => {
      const { month, monthDate } = await seedSchedule(admin, kstDate(1));
      const outside = nextMonthStart(monthDate);

      const error = await captureDomainError(() =>
        submitAvailability(worker.client, month, [outside]),
      );

      expect(error.code).toBe("bad_dates");
    });
  });

  it("마감 당일에는 신청이 통과한다", async () => {
    const { month, monthDate } = await seedSchedule(admin, kstDate(0));
    const date = dayInMonth(monthDate, 1);

    await submitAvailability(worker.client, month, [date]);

    const dates = await availabilityDatesFor(
      admin,
      worker.profileId,
      monthDate,
    );
    expect(dates).toEqual([date]);
  });

  it("다시 보내면 그 달 행을 지우고 새로 넣는다", async () => {
    const { month, monthDate } = await seedSchedule(admin, kstDate(1));
    const day1 = dayInMonth(monthDate, 1);
    const day2 = dayInMonth(monthDate, 2);
    const day3 = dayInMonth(monthDate, 3);

    await submitAvailability(worker.client, month, [day1, day2]);
    expect(
      await availabilityDatesFor(admin, worker.profileId, monthDate),
    ).toEqual([day1, day2]);

    await submitAvailability(worker.client, month, [day3]);
    expect(
      await availabilityDatesFor(admin, worker.profileId, monthDate),
    ).toEqual([day3]);
  });

  it("빈 배열을 보내면 그 달 신청이 전부 사라진다", async () => {
    const { month, monthDate } = await seedSchedule(admin, kstDate(1));
    const day1 = dayInMonth(monthDate, 1);

    await submitAvailability(worker.client, month, [day1]);
    expect(
      await availabilityDatesFor(admin, worker.profileId, monthDate),
    ).toEqual([day1]);

    await submitAvailability(worker.client, month, []);
    expect(
      await availabilityDatesFor(admin, worker.profileId, monthDate),
    ).toEqual([]);
  });

  it("유효한 날 둘과 그 달 밖 하나가 섞이면 bad_dates고 기존 행이 그대로다", async () => {
    const { month, monthDate } = await seedSchedule(admin, kstDate(1));
    const existing = dayInMonth(monthDate, 1);
    const validA = dayInMonth(monthDate, 2);
    const validB = dayInMonth(monthDate, 3);
    const outside = nextMonthStart(monthDate);

    seedExistingAvailability(worker.profileId, existing);

    const error = await captureDomainError(() =>
      submitAvailability(worker.client, month, [validA, validB, outside]),
    );

    expect(error.code).toBe("bad_dates");
    expect(
      await availabilityDatesFor(admin, worker.profileId, monthDate),
    ).toEqual([existing]);
  });
});
