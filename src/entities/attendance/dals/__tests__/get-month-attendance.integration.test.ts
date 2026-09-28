import type { Database } from "@/shared/api/database";
import { getMonthAttendance } from "@/entities/attendance/dals/get-month-attendance";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  kstDate,
  kstMonthEnd,
  kstMonthStart,
  seedAssignment,
  seedCheckIn,
  withFreshMonth,
  type AdminUser,
  type ApprovedUser,
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

async function seedScheduleMonth(admin: AdminUser): Promise<SeededMonth> {
  return withFreshMonth(async (monthsFromNow) => {
    const monthStart = kstMonthStart(monthsFromNow);
    await rpcOrThrow(admin, "create_schedule", {
      p_month: monthStart,
      p_deadline: kstDate(1),
    });
    return { month: monthStart.slice(0, 7), monthStart, monthsFromNow };
  });
}

describe("getMonthAttendance — 그달치 check_ins와 excuse_status를 한 질의로 낸다(stats-admin AC-04)", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
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
    expect(result.checkIns.map((row) => row.profile_id).sort()).toEqual(
      [workerA.profileId, workerB.profileId].sort(),
    );
    expect(new Set(result.checkIns.map((row) => row.day_id)).size).toBe(2);
  });

  it("전달 마지막 날과 다음 달 첫날은 안 온다", async () => {
    const owner: ApprovedUser = await createApprovedUser();
    const { month, monthStart, monthsFromNow } = await seedScheduleMonth(admin);

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

    expect(result.checkIns.map((row) => row.day_id)).toEqual([targetDayId]);
  });

  it("그달에 연 날이 하나도 없으면 두 배열이 다 빈다", async () => {
    const emptyMonth = kstMonthStart(
      600 + Math.floor(Math.random() * 600),
    ).slice(0, 7);

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
        day_id: dayId,
        profile_id: checkedInWorker.profileId,
        checked_at: expect.any(String),
        reported_at: expect.any(String),
        received_at: expect.any(String),
        method: expect.any(String),
      }),
    ]);
    expect(
      result.checkIns.some((row) => row.profile_id === excusedWorker.profileId),
    ).toBe(false);

    expect(result.excuseStatuses).toEqual([
      {
        day_id: dayId,
        profile_id: excusedWorker.profileId,
        submitted_at: expect.any(String),
        decided_at: expect.any(String),
        decision: "approved",
      },
    ]);
    expect(result.excuseStatuses[0]).not.toHaveProperty("body");
  });
});
