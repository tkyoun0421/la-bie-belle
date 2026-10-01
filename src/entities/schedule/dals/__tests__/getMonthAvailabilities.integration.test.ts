import { getMonthAvailabilities } from "@/entities/schedule/dals/get-month-availabilities";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  kstMonthStart,
  type AdminUser,
  type ApprovedUser,
} from "@tests/integration/postgres";

function randomOffset(): number {
  return 24 + Math.floor(Math.random() * 90000);
}

function dayInMonth(monthDate: string, day: number): string {
  return `${monthDate.slice(0, 7)}-${String(day).padStart(2, "0")}`;
}

function setDisplayName(profileId: string, displayName: string): void {
  execSql(
    "update public.profiles set display_name = :'display_name' where id = :'profile_id';\n",
    { profile_id: profileId, display_name: displayName },
  );
}

function insertAvailability(profileId: string, workDate: string): void {
  execSql(
    "insert into public.availabilities (profile_id, work_date) values (:'profile_id', :'work_date');\n",
    { profile_id: profileId, work_date: workDate },
  );
}

describe("getMonthAvailabilities dal — 그 달 근무 신청을 profiles.display_name과 함께 읽는다", () => {
  let admin: AdminUser;
  let workerA: ApprovedUser;
  let workerB: ApprovedUser;

  beforeAll(async () => {
    admin = await createAdminUser();
    workerA = await createApprovedUser();
    workerB = await createApprovedUser();
  });

  it("관리자 세션에는 전원의 신청과 display_name이 함께 온다", async () => {
    const monthDate = kstMonthStart(randomOffset());
    const month = monthDate.slice(0, 7);
    const dateA = dayInMonth(monthDate, 1);
    const dateB = dayInMonth(monthDate, 2);
    setDisplayName(workerA.profileId, "가나다");
    insertAvailability(workerA.profileId, dateA);
    insertAvailability(workerB.profileId, dateB);

    const rows = await getMonthAvailabilities(admin.client, month);

    const rowA = rows.find((row) => row.profile_id === workerA.profileId);
    const rowB = rows.find((row) => row.profile_id === workerB.profileId);
    expect(rowA?.work_date).toBe(dateA);
    expect(rowA?.profiles?.display_name).toBe("가나다");
    expect(rowB?.work_date).toBe(dateB);
  });

  it("근무자 세션에는 본인 행만 온다(RLS)", async () => {
    const monthDate = kstMonthStart(randomOffset());
    const month = monthDate.slice(0, 7);
    const dateA = dayInMonth(monthDate, 1);
    const dateB = dayInMonth(monthDate, 2);
    insertAvailability(workerA.profileId, dateA);
    insertAvailability(workerB.profileId, dateB);

    const rows = await getMonthAvailabilities(workerA.client, month);

    expect(rows.map((row) => row.profile_id)).toEqual([workerA.profileId]);
  });
});
