import { randomBytes, randomUUID } from "node:crypto";
import {
  PROFILE_REFERENCES,
  purgeTestUsers,
  staleOrphanTestProfileIds,
} from "@tests/integration/cleanup";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  kstDate,
  kstMonthStart,
  queryColumn,
  seedAssignment,
  withFreshMonth,
  type AdminUser,
} from "@tests/integration/postgres";
import { createGuestClient } from "@tests/integration/supabase";
import {
  newRunId,
  RUN_ID_ENV,
  runEmailPattern,
  runIdOf,
  testUserEmail,
} from "@tests/integration/testUserMark";
import { takeRegistered } from "@tests/integration/testUserRegistry";

const RUN_ID_FROM_GLOBAL_SETUP = process.env[RUN_ID_ENV];

function countOf(sql: string, vars: Record<string, string>): number {
  return Number(queryColumn(sql, vars)[0] ?? "0");
}

function userExists(userId: string): boolean {
  return (
    countOf("select count(*) from auth.users where id = :'id';\n", {
      id: userId,
    }) > 0
  );
}

function profileExists(profileId: string): boolean {
  return (
    countOf("select count(*) from public.profiles where id = :'id';\n", {
      id: profileId,
    }) > 0
  );
}

async function openDayOf(admin: AdminUser): Promise<{
  scheduleId: string;
  dayId: string;
}> {
  return withFreshMonth(async (monthsFromNow) => {
    const workDate = kstMonthStart(monthsFromNow);
    const created = await admin.client.rpc("create_schedule", {
      p_month: workDate,
      p_deadline: kstDate(1),
    });
    if (created.error) {
      throw created.error;
    }
    const opened = await admin.client.rpc("open_day", {
      p_work_date: workDate,
    });
    if (opened.error) {
      throw opened.error;
    }

    const { data, error } = await admin.client
      .from("days")
      .select("id, schedule_id")
      .eq("work_date", workDate)
      .single<{ id: string; schedule_id: string }>();
    if (error || !data) {
      throw error ?? new Error("연 날을 못 찾았다");
    }
    return { scheduleId: data.schedule_id, dayId: data.id };
  });
}

function clearUserId(profileId: string): void {
  execSql(
    "update public.profiles set user_id = null where id = :'profile_id';\n",
    { profile_id: profileId },
  );
}

function ensureProfileOf(userId: string): string {
  const [profileId] = queryColumn(
    "insert into public.profiles (user_id) values (:'user_id') returning id;\n",
    { user_id: userId },
  );
  return profileId;
}

function orphanAsLegacyFixture(
  profileId: string,
  { hoursAgo, submitted }: { hoursAgo: number; submitted: boolean },
): void {
  execSql(
    "update public.profiles\n" +
      "set user_id = null,\n" +
      `    submitted_at = ${submitted ? "submitted_at" : "null"},\n` +
      "    created_at = now() - make_interval(hours => :'hours_ago'::integer)\n" +
      "where id = :'profile_id';\n",
    { profile_id: profileId, hours_ago: String(hoursAgo) },
  );
}

async function signUpAs(email: string): Promise<string> {
  const { data, error } = await createGuestClient().auth.signUp({
    email,
    password: randomUUID(),
  });
  if (error || !data.user) {
    throw error ?? new Error(`가입한 사용자를 못 받았다: ${email}`);
  }
  return data.user.id;
}

describe("회차 표식", () => {
  it("globalSetup이 만든 runId가 워커에 넘어와 가입 헬퍼의 이메일에 실린다", async () => {
    const user = await createApprovedUser();

    expect(RUN_ID_FROM_GLOBAL_SETUP).toBeDefined();
    expect(runIdOf(user.email)).toBe(RUN_ID_FROM_GLOBAL_SETUP);
  });
});

describe("profiles를 참조하는 FK", () => {
  it("cascade가 아닌 FK는 전부 정리 목록에 있고 목록에는 그것만 있다", () => {
    const fromDb = queryColumn(
      "select c.conrelid::regclass::text || '.' || a.attname\n" +
        "from pg_constraint c\n" +
        "join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)\n" +
        "where c.contype = 'f'\n" +
        "  and c.confrelid = 'public.profiles'::regclass\n" +
        "  and c.confdeltype <> 'c';\n",
    );

    expect([...fromDb].sort()).toEqual(
      PROFILE_REFERENCES.map(
        ({ table, column }) => `${table}.${column}`,
      ).sort(),
    );
  });
});

describe("purgeTestUsers", () => {
  it("사용자와 프로필, 그가 만든 근무표와 그를 가리키는 행을 한 번에 지운다", async () => {
    const admin = await createAdminUser();
    const member = await createApprovedUser();
    const { scheduleId, dayId } = await openDayOf(admin);
    const assignmentId = seedAssignment(dayId, member.profileId, "training");

    purgeTestUsers({ userIds: [admin.userId, member.userId], profileIds: [] });

    expect(userExists(admin.userId)).toBe(false);
    expect(userExists(member.userId)).toBe(false);
    expect(profileExists(admin.profileId)).toBe(false);
    expect(profileExists(member.profileId)).toBe(false);
    expect(
      countOf("select count(*) from public.schedules where id = :'id';\n", {
        id: scheduleId,
      }),
    ).toBe(0);
    expect(
      countOf("select count(*) from public.assignments where id = :'id';\n", {
        id: assignmentId,
      }),
    ).toBe(0);
  });

  it("다른 회차 표식의 사용자는 id가 넘어와도 지우지 않는다", async () => {
    const otherRunId = newRunId(new Date(), randomBytes(3).toString("hex"));
    const otherUserId = await signUpAs(testUserEmail(otherRunId, randomUUID()));

    purgeTestUsers({ userIds: [otherUserId], profileIds: [] });
    const survived = userExists(otherUserId);
    purgeTestUsers(
      { userIds: [otherUserId], profileIds: [] },
      runEmailPattern(otherRunId),
    );

    expect(survived).toBe(true);
    expect(userExists(otherUserId)).toBe(false);
  });

  it("표식이 맞아도 넘어온 id가 아니면 지우지 않는다", async () => {
    const kept = await createApprovedUser();
    const purged = await createApprovedUser();

    purgeTestUsers({ userIds: [purged.userId], profileIds: [] });

    expect(userExists(purged.userId)).toBe(false);
    expect(userExists(kept.userId)).toBe(true);
    expect(profileExists(kept.profileId)).toBe(true);
  });

  it("user_id가 빈 profile도 넘어온 profile id면 지운다", async () => {
    const member = await createApprovedUser();
    clearUserId(member.profileId);

    purgeTestUsers({
      userIds: [member.userId],
      profileIds: [member.profileId],
    });

    expect(userExists(member.userId)).toBe(false);
    expect(profileExists(member.profileId)).toBe(false);
  });

  it("user_id가 빈 profile이라도 넘어온 profile id가 아니면 지우지 않는다", async () => {
    const orphan = await createApprovedUser();
    clearUserId(orphan.profileId);
    const purged = await createApprovedUser();

    purgeTestUsers({
      userIds: [purged.userId],
      profileIds: [purged.profileId],
    });

    expect(profileExists(purged.profileId)).toBe(false);
    expect(profileExists(orphan.profileId)).toBe(true);
  });

  it("넘어온 profile id라도 다른 회차 표식 사용자의 profile이면 지우지 않는다", async () => {
    const otherRunId = newRunId(new Date(), randomBytes(3).toString("hex"));
    const otherUserId = await signUpAs(testUserEmail(otherRunId, randomUUID()));
    const otherProfileId = ensureProfileOf(otherUserId);

    purgeTestUsers({ userIds: [], profileIds: [otherProfileId] });
    const survived = profileExists(otherProfileId);
    purgeTestUsers(
      { userIds: [otherUserId], profileIds: [] },
      runEmailPattern(otherRunId),
    );

    expect(survived).toBe(true);
    expect(profileExists(otherProfileId)).toBe(false);
  });
});

describe("가입 헬퍼가 만든 profile", () => {
  it("user_id를 비워도 등록부를 꺼내 정리하면 지워진다", async () => {
    const member = await createApprovedUser();
    clearUserId(member.profileId);

    purgeTestUsers(takeRegistered());

    expect(profileExists(member.profileId)).toBe(false);
  });
});

describe("옛 회차가 남긴 user_id 빈 profile 고르기", () => {
  it("만든 지 6시간이 넘었고 제출 없이 승인만 찍힌 profile을 고른다", async () => {
    const legacy = await createApprovedUser();
    orphanAsLegacyFixture(legacy.profileId, { hoursAgo: 7, submitted: false });

    expect(staleOrphanTestProfileIds(new Date())).toContain(legacy.profileId);
  });

  it("만든 지 6시간이 안 넘었으면 고르지 않는다", async () => {
    const recent = await createApprovedUser();
    orphanAsLegacyFixture(recent.profileId, { hoursAgo: 1, submitted: false });

    expect(staleOrphanTestProfileIds(new Date())).not.toContain(
      recent.profileId,
    );
  });

  it("제출 시각이 있으면 고르지 않는다", async () => {
    const submitted = await createApprovedUser();
    orphanAsLegacyFixture(submitted.profileId, {
      hoursAgo: 7,
      submitted: true,
    });

    expect(staleOrphanTestProfileIds(new Date())).not.toContain(
      submitted.profileId,
    );
  });

  it("user_id가 남은 profile은 고르지 않는다", async () => {
    const member = await createApprovedUser();
    execSql(
      "update public.profiles set submitted_at = null, created_at = now() - interval '7 hours' where id = :'profile_id';\n",
      { profile_id: member.profileId },
    );

    expect(staleOrphanTestProfileIds(new Date())).not.toContain(
      member.profileId,
    );
  });
});
