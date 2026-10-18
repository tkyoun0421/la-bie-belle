import type { Database } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getMonthAttendance } from "@/entities/attendance/api/getMonthAttendance.api";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  freshMonth,
  kstDate,
  kstMonthEnd,
  kstMonthStart,
  queryColumn,
  seedAssignment,
  seedCheckIn,
  withFreshMonth,
  type AdminUser,
  type ApprovedUser,
  type FreshMonthOptions,
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

async function openDay(admin: AdminUser, workDate: string): Promise<string> {
  await rpcOrThrow(admin, "open_day", { p_work_date: workDate });

  const { data, error } = await admin.client
    .from("days")
    .select("id")
    .eq("work_date", workDate)
    .single<{ id: string }>();
  if (error || !data) {
    throw error ?? new Error("연 날을 못 찾았다");
  }
  return data.id;
}

function addDays(workDate: string, days: number): string {
  const date = new Date(`${workDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function seedExcuse(dayId: string, profileId: string, decidedBy: string): void {
  const now = new Date().toISOString();
  execSql(
    "insert into public.excuses (day_id, profile_id, body, decided_at, decided_by, decision) values (:'day_id', :'profile_id', '사정이 있었다', :'now', :'decided_by', 'approved');\n",
    { day_id: dayId, profile_id: profileId, now, decided_by: decidedBy },
  );
}

type SeededMonth = { month: string; monthStart: string; monthsFromNow: number };

async function seedScheduleMonth(
  admin: AdminUser,
  options: FreshMonthOptions = {},
): Promise<SeededMonth> {
  return withFreshMonth(async (monthsFromNow) => {
    const monthStart = kstMonthStart(monthsFromNow);
    await rpcOrThrow(admin, "create_schedule", {
      p_month: monthStart,
      p_deadline: kstDate(1),
    });
    return { month: monthStart.slice(0, 7), monthStart, monthsFromNow };
  }, options);
}

describe("getMonthAttendance — 그달치 check_ins와 excuse_status를 한 질의로 낸다(stats-admin AC-04)", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("캐시 키는 ['attendance', 그달]이다 — 날 키(get-day-attendance)와 같은 모양이라 상태 계산 함수가 두 키 위에서 그대로 돈다", () => {
    expect(queryKeys.attendance.month("2026-09")).toEqual([
      "attendance",
      "2026-09",
    ]);
  });

  it("달이 아니라 그달 안의 날짜를 넣어도 앞 7자로 접혀 같은 키가 된다", () => {
    expect(queryKeys.attendance.month("2026-09-20")).toEqual([
      "attendance",
      "2026-09",
    ]);
  });

  it("그달 여러 사람·여러 날의 행이 한 번에 온다", async () => {
    const workerA = await createApprovedUser();
    const workerB = await createApprovedUser();
    const { month, monthStart } = await seedScheduleMonth(admin);

    const day1Id = await openDay(admin, monthStart);
    const day2Id = await openDay(admin, addDays(monthStart, 2));

    seedAssignment(day1Id, workerA.profileId, "training");
    seedAssignment(day2Id, workerB.profileId, "training");

    const now = new Date().toISOString();
    seedCheckIn(day1Id, workerA.profileId, now);
    seedCheckIn(day2Id, workerB.profileId, now);

    const result = await getMonthAttendance(admin.client, month);

    expect(result.checkIns).toHaveLength(2);
    expect(result.checkIns.map((row) => row.profileId).sort()).toEqual(
      [workerA.profileId, workerB.profileId].sort(),
    );
    expect(new Set(result.checkIns.map((row) => row.dayId)).size).toBe(2);
  });

  it("전달 마지막 날과 다음 달 첫날은 안 온다", async () => {
    const owner: ApprovedUser = await createApprovedUser();
    const { month, monthStart, monthsFromNow } = await seedScheduleMonth(
      admin,
      { neighbours: true },
    );

    const prevMonthStart = kstMonthStart(monthsFromNow - 1);
    const prevMonthLastDay = kstMonthEnd(monthsFromNow - 1);
    const nextMonthStart = kstMonthStart(monthsFromNow + 1);

    await rpcOrThrow(admin, "create_schedule", {
      p_month: prevMonthStart,
      p_deadline: kstDate(1),
    });
    await rpcOrThrow(admin, "create_schedule", {
      p_month: nextMonthStart,
      p_deadline: kstDate(1),
    });

    const targetDayId = await openDay(admin, monthStart);
    const prevDayId = await openDay(admin, prevMonthLastDay);
    const nextDayId = await openDay(admin, nextMonthStart);

    seedAssignment(targetDayId, owner.profileId, "training");
    seedAssignment(prevDayId, owner.profileId, "training");
    seedAssignment(nextDayId, owner.profileId, "training");

    const now = new Date().toISOString();
    seedCheckIn(targetDayId, owner.profileId, now);
    seedCheckIn(prevDayId, owner.profileId, now);
    seedCheckIn(nextDayId, owner.profileId, now);

    const result = await getMonthAttendance(admin.client, month);

    expect(result.checkIns.map((row) => row.dayId)).toEqual([targetDayId]);
  });

  it("그달에 연 날이 하나도 없으면 두 배열이 다 빈다", async () => {
    const emptyMonth = kstMonthStart(freshMonth()).slice(0, 7);

    const result = await getMonthAttendance(admin.client, emptyMonth);

    expect(result.checkIns).toEqual([]);
    expect(result.excuseStatuses).toEqual([]);
  });

  it("사유(excuse_status)와 인증(check_ins)이 각각 제 배열에 실린다", async () => {
    const checkedInWorker = await createApprovedUser();
    const excusedWorker = await createApprovedUser();
    const { month, monthStart } = await seedScheduleMonth(admin);

    const dayId = await openDay(admin, monthStart);
    seedAssignment(dayId, checkedInWorker.profileId, "training");
    seedAssignment(dayId, excusedWorker.profileId, "training");

    const now = new Date().toISOString();
    seedCheckIn(dayId, checkedInWorker.profileId, now);
    seedExcuse(dayId, excusedWorker.profileId, admin.profileId);

    const result = await getMonthAttendance(admin.client, month);

    expect(result.checkIns).toEqual([
      expect.objectContaining({
        dayId,
        profileId: checkedInWorker.profileId,
        checkedAt: expect.any(String),
        reportedAt: expect.any(String),
        receivedAt: expect.any(String),
        method: expect.any(String),
      }),
    ]);
    expect(
      result.checkIns.some((row) => row.profileId === excusedWorker.profileId),
    ).toBe(false);

    expect(result.excuseStatuses).toEqual([
      {
        dayId,
        profileId: excusedWorker.profileId,
        submittedAt: expect.any(String),
        decidedAt: expect.any(String),
        decision: "approved",
      },
    ]);
    expect(result.excuseStatuses[0]).not.toHaveProperty("body");
  });
});

const BULK_PROFILES = 36;
const BULK_DAYS = 31;
const BULK_ROWS = BULK_DAYS * BULK_PROFILES;

function seedBulkProfiles(): string[] {
  return queryColumn(
    "with inserted as (\n" +
      "  insert into public.profiles (display_name)\n" +
      `  select 'bulk-' || g from generate_series(1, ${BULK_PROFILES}) as g\n` +
      "  returning id\n" +
      ")\n" +
      "select id from inserted;\n",
  );
}

function seedMonthWithShuffledCheckIns(
  adminProfileId: string,
  profileIds: readonly string[],
  monthDate: string,
  lastDate: string,
): string {
  const [scheduleId] = queryColumn(
    "with inserted as (\n" +
      "  insert into public.schedules (month, created_by)\n" +
      "  values (:'month', :'created_by') returning id\n" +
      ")\n" +
      "select id from inserted;\n",
    { month: monthDate, created_by: adminProfileId },
  );
  execSql(
    "insert into public.days (schedule_id, work_date, starts_at, ends_at, opened_by)\n" +
      "select :'schedule_id', d::date, '09:00', '18:00', :'opened_by'\n" +
      "from generate_series(:'first'::date, :'last'::date, interval '1 day') as d;\n" +
      "insert into public.check_ins (day_id, profile_id, checked_at, reported_at, received_at, method)\n" +
      "select days.id, p, now(), now(), now(), 'qr'\n" +
      "from public.days as days\n" +
      "cross join unnest(:'ids'::uuid[]) as p\n" +
      "where days.schedule_id = :'schedule_id'\n" +
      "order by random();\n",
    {
      schedule_id: scheduleId,
      opened_by: adminProfileId,
      first: monthDate,
      last: lastDate,
      ids: `{${profileIds.join(",")}}`,
    },
  );
  return scheduleId;
}

describe("getMonthAttendance — 천 행을 넘는 달의 check_ins도 잘리지 않고 읽는다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("한 달 출석이 1116행이어도 전부 오고 중복이 없고 날·사람 순이다", async () => {
    const offset = freshMonth({ days: 31 });
    const monthDate = kstMonthStart(offset);
    const profileIds = seedBulkProfiles();
    let scheduleId: string | undefined;

    try {
      scheduleId = seedMonthWithShuffledCheckIns(
        admin.profileId,
        profileIds,
        monthDate,
        kstMonthEnd(offset),
      );

      const attendance = await getMonthAttendance(
        admin.client,
        monthDate.slice(0, 7),
      );
      const keys = attendance.checkIns.map(
        (row) => `${row.dayId}|${row.profileId}`,
      );

      expect(attendance.checkIns).toHaveLength(BULK_ROWS);
      expect(new Set(keys).size).toBe(BULK_ROWS);
      expect(keys).toEqual([...keys].sort());
    } finally {
      if (scheduleId !== undefined) {
        execSql(
          "delete from public.days where schedule_id = :'schedule_id';\n",
          {
            schedule_id: scheduleId,
          },
        );
        execSql("delete from public.schedules where id = :'schedule_id';\n", {
          schedule_id: scheduleId,
        });
      }
      execSql("delete from public.profiles where id = any(:'ids'::uuid[]);\n", {
        ids: `{${profileIds.join(",")}}`,
      });
    }
  });
});
