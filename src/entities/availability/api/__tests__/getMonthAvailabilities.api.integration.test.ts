import { getMonthAvailabilities } from "@/entities/availability/api/getMonthAvailabilities.api";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  freshMonth,
  kstMonthEnd,
  kstMonthStart,
  queryColumn,
  type AdminUser,
  type ApprovedUser,
} from "@tests/integration/postgres";

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
    const monthDate = kstMonthStart(
      freshMonth({ table: "availabilities", column: "work_date" }),
    );
    const month = monthDate.slice(0, 7);
    const dateA = dayInMonth(monthDate, 1);
    const dateB = dayInMonth(monthDate, 2);
    setDisplayName(workerA.profileId, "가나다");
    insertAvailability(workerA.profileId, dateA);
    insertAvailability(workerB.profileId, dateB);

    const rows = await getMonthAvailabilities(admin.client, month);

    const rowA = rows.find((row) => row.profileId === workerA.profileId);
    const rowB = rows.find((row) => row.profileId === workerB.profileId);
    expect(rowA?.workDate).toBe(dateA);
    expect(rowA?.name).toBe("가나다");
    expect(rowB?.workDate).toBe(dateB);
  });

  it("근무자 세션에는 본인 행만 온다(RLS)", async () => {
    const monthDate = kstMonthStart(
      freshMonth({ table: "availabilities", column: "work_date" }),
    );
    const month = monthDate.slice(0, 7);
    const dateA = dayInMonth(monthDate, 1);
    const dateB = dayInMonth(monthDate, 2);
    insertAvailability(workerA.profileId, dateA);
    insertAvailability(workerB.profileId, dateB);

    const rows = await getMonthAvailabilities(workerA.client, month);

    expect(rows.map((row) => row.profileId)).toEqual([workerA.profileId]);
  });
});

const BULK_PROFILES = 36;
const BULK_ROWS = 31 * BULK_PROFILES;

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

function deleteProfiles(profileIds: readonly string[]): void {
  execSql("delete from public.profiles where id = any(:'ids'::uuid[]);\n", {
    ids: `{${profileIds.join(",")}}`,
  });
}

function seedShuffledAvailabilities(
  profileIds: readonly string[],
  monthDate: string,
  lastDate: string,
): void {
  execSql(
    "insert into public.availabilities (profile_id, work_date)\n" +
      "select p, d::date\n" +
      "from unnest(:'ids'::uuid[]) as p\n" +
      "cross join generate_series(:'first'::date, :'last'::date, interval '1 day') as d\n" +
      "order by random();\n",
    {
      ids: `{${profileIds.join(",")}}`,
      first: monthDate,
      last: lastDate,
    },
  );
}

describe("getMonthAvailabilities dal — 천 행을 넘는 달도 잘리지 않고 읽는다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("한 달 신청이 1116행이어도 전부 오고 중복이 없고 날짜·사람 순이다", async () => {
    const offset = freshMonth({
      table: "availabilities",
      column: "work_date",
      days: 31,
    });
    const monthDate = kstMonthStart(offset);
    const profileIds = seedBulkProfiles();

    try {
      seedShuffledAvailabilities(profileIds, monthDate, kstMonthEnd(offset));

      const rows = await getMonthAvailabilities(
        admin.client,
        monthDate.slice(0, 7),
      );
      const keys = rows.map((row) => `${row.workDate}|${row.profileId}`);

      expect(rows).toHaveLength(BULK_ROWS);
      expect(new Set(keys).size).toBe(BULK_ROWS);
      expect(keys).toEqual([...keys].sort());
    } finally {
      deleteProfiles(profileIds);
    }
  });
});
