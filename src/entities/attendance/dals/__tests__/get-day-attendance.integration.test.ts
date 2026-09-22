import {
  dayAttendanceKey,
  getDayAttendance,
} from "@/entities/attendance/dals/get-day-attendance";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  seedAssignment,
  withFreshMonth,
  type AdminUser,
  type ApprovedUser,
} from "@tests/integration/postgres";

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function tomorrowDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toDateString(date);
}

function firstOfMonthOffset(monthsFromNow: number): string {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + monthsFromNow);
  return toDateString(date);
}

async function rpcOrThrow(
  admin: AdminUser,
  fn: string,
  args: Record<string, unknown>,
): Promise<void> {
  const { error } = await admin.client.rpc(fn, args);
  if (error) {
    throw error;
  }
}

async function openFreshDay(
  admin: AdminUser,
): Promise<{ dayId: string; workDate: string }> {
  return withFreshMonth(async (monthsFromNow) => {
    const month = firstOfMonthOffset(monthsFromNow);
    await rpcOrThrow(admin, "create_schedule", {
      p_month: month,
      p_deadline: tomorrowDate(),
    });
    await rpcOrThrow(admin, "open_day", { p_work_date: month });

    const { data, error } = await admin.client
      .from("days")
      .select("id")
      .eq("work_date", month)
      .single<{ id: string }>();
    if (error || !data) {
      throw error ?? new Error("연 날을 못 찾았다");
    }
    return { dayId: data.id, workDate: month };
  });
}

describe("getDayAttendance — 그날 check_ins와 excuse_status를 같이 읽는다(AC-07)", () => {
  let admin: AdminUser;
  let checkedInWorker: ApprovedUser;
  let excusedWorker: ApprovedUser;

  beforeAll(async () => {
    admin = await createAdminUser();
    checkedInWorker = await createApprovedUser();
    excusedWorker = await createApprovedUser();
  });

  it("캐시 키는 ['attendance', 그날]이다", () => {
    expect(dayAttendanceKey("2026-09-20")).toEqual([
      "attendance",
      "2026-09-20",
    ]);
  });

  it("그날 check_ins 행과 excuse_status 행을 같이 준다", async () => {
    const { dayId, workDate } = await openFreshDay(admin);
    seedAssignment(dayId, checkedInWorker.profileId, "training");
    seedAssignment(dayId, excusedWorker.profileId, "training");

    const now = new Date().toISOString();
    execSql(
      "insert into public.check_ins (day_id, profile_id, checked_at, reported_at, received_at, method) values (:'day_id', :'profile_id', :'now', :'now', :'now', 'location');\n",
      { day_id: dayId, profile_id: checkedInWorker.profileId, now },
    );
    execSql(
      "insert into public.excuses (day_id, profile_id, body, decided_at, decided_by, decision) values (:'day_id', :'profile_id', '사정이 있었다', :'now', :'decided_by', 'approved');\n",
      {
        day_id: dayId,
        profile_id: excusedWorker.profileId,
        now,
        decided_by: admin.profileId,
      },
    );

    const result = await getDayAttendance(checkedInWorker.client, workDate);

    expect(result.checkIns).toHaveLength(1);
    expect(result.checkIns[0]?.profile_id).toBe(checkedInWorker.profileId);

    expect(result.excuseStatuses).toHaveLength(1);
    expect(result.excuseStatuses[0]?.profile_id).toBe(excusedWorker.profileId);
    expect(result.excuseStatuses[0]?.decision).toBe("approved");
    expect(result.excuseStatuses[0]).not.toHaveProperty("body");
  });

  it("연 날이 없으면 빈 배열을 준다", async () => {
    const workDate = firstOfMonthOffset(500 + Math.floor(Math.random() * 500));

    const result = await getDayAttendance(checkedInWorker.client, workDate);

    expect(result.checkIns).toEqual([]);
    expect(result.excuseStatuses).toEqual([]);
  });
});
