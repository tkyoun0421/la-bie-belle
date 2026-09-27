import { randomUUID } from "node:crypto";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  kstDate,
  kstMonthStart,
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

function seedGrant(
  profileId: string,
  position: string,
  grantedBy: string,
): void {
  execSql(
    "insert into public.position_grants (profile_id, position, granted_by) values (:'profile_id', :'position', :'granted_by');\n",
    { profile_id: profileId, position, granted_by: grantedBy },
  );
}

function seedTraining(
  dayId: string,
  profileId: string,
  position: string,
): string {
  const id = randomUUID();
  execSql(
    "insert into public.assignments (id, day_id, slot_id, position, profile_id, kind) values (:'id', :'day_id', null, :'position', :'profile_id', 'training');\n",
    { id, day_id: dayId, profile_id: profileId, position },
  );
  return id;
}

function cancelTraining(assignmentId: string): void {
  execSql(
    "update public.assignments set ended_at = now(), ended_reason = 'cancelled' where id = :'id';\n",
    { id: assignmentId },
  );
}

type QualificationsTable = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => Promise<{
        data: { profile_id: string; position: string }[] | null;
        error: unknown;
      }>;
    };
  };
};

async function qualificationsFor(
  user: RpcCaller,
  profileId: string,
): Promise<{ profile_id: string; position: string }[]> {
  const client = user.client as unknown as QualificationsTable;
  const { data, error } = await client
    .from("qualifications")
    .select("profile_id, position")
    .eq("profile_id", profileId);
  if (error) {
    throw error;
  }
  return data ?? [];
}

describe("qualifications 뷰 — 자격 부여와 살아 있는 교육 배정을 합친다(design.md 「자격」)", () => {
  let admin: AdminUser;
  let dayId: string;

  beforeAll(async () => {
    admin = await createAdminUser();
    dayId = (await seedOpenDay(admin)).dayId;
  });

  it("자격 부여만 있어도 자격이다", async () => {
    const grantee = await createApprovedUser();
    seedGrant(grantee.profileId, "팀장", admin.profileId);

    const rows = await qualificationsFor(admin, grantee.profileId);
    expect(rows).toEqual([{ profile_id: grantee.profileId, position: "팀장" }]);
  });

  it("교육 배정만 있어도 자격이다", async () => {
    const trainee = await createApprovedUser();
    seedTraining(dayId, trainee.profileId, "스캔");

    const rows = await qualificationsFor(admin, trainee.profileId);
    expect(rows).toEqual([{ profile_id: trainee.profileId, position: "스캔" }]);
  });

  it("둘 다 있으면 둘 다 잡힌다", async () => {
    const person = await createApprovedUser();
    seedGrant(person.profileId, "메인", admin.profileId);
    seedTraining(dayId, person.profileId, "드레스");

    const rows = await qualificationsFor(admin, person.profileId);
    const positions = rows.map((row) => row.position).sort();
    expect(positions).toEqual(["드레스", "메인"]);
  });

  it("취소된 교육 배정은 자격에서 빠진다", async () => {
    const trainee = await createApprovedUser();
    const assignmentId = seedTraining(dayId, trainee.profileId, "드레스실");
    cancelTraining(assignmentId);

    const rows = await qualificationsFor(admin, trainee.profileId);
    expect(rows).toEqual([]);
  });

  it("근무자 세션에서도 읽힌다(security_invoker + 기존 RLS)", async () => {
    const grantee = await createApprovedUser();
    seedGrant(grantee.profileId, "팀장", admin.profileId);
    const reader = await createApprovedUser();

    const rows = await qualificationsFor(reader, grantee.profileId);
    expect(rows).toEqual([{ profile_id: grantee.profileId, position: "팀장" }]);
  });
});
