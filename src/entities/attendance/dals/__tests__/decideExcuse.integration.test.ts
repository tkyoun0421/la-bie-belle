import type { Database } from "@/shared/api/database";
import { DomainError } from "@/shared/api/errors";
import { decideExcuse } from "@/entities/attendance/dals/decide-excuse";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  kstDate,
  kstMonthStart,
  seedAssignment,
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

async function openFreshDay(admin: AdminUser): Promise<{ dayId: string }> {
  return withFreshMonth(async (monthsFromNow) => {
    const month = kstMonthStart(monthsFromNow);
    await rpcOrThrow(admin, "create_schedule", {
      p_month: month,
      p_deadline: kstDate(1),
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
    return { dayId: data.id };
  });
}

async function seedPendingExcuse(
  admin: AdminUser,
  profileId: string,
): Promise<string> {
  const { dayId } = await openFreshDay(admin);
  seedAssignment(dayId, profileId, "training");
  execSql(
    "insert into public.excuses (day_id, profile_id, body) values (:'day_id', :'profile_id', '판정 대기 사유');\n",
    { day_id: dayId, profile_id: profileId },
  );
  const { data, error } = await admin.client
    .from("excuses")
    .select("id")
    .eq("day_id", dayId)
    .eq("profile_id", profileId)
    .single<{ id: string }>();
  if (error || !data) {
    throw error ?? new Error("사유를 못 찾았다");
  }
  return data.id;
}

describe("decideExcuse dal — decide_excuse를 부르고 오류를 DomainError로 올린다(AC-07)", () => {
  let admin: AdminUser;
  let worker: ApprovedUser;

  beforeAll(async () => {
    admin = await createAdminUser();
    worker = await createApprovedUser();
  });

  it("성공하면 excuses의 판정 열이 실제로 바뀐다", async () => {
    const excuseId = await seedPendingExcuse(admin, worker.profileId);

    await decideExcuse(admin.client, {
      excuseId,
      approved: true,
      reason: null,
    });

    const { data, error } = await admin.client
      .from("excuses")
      .select("decision, decided_at")
      .eq("id", excuseId)
      .single<{ decision: string | null; decided_at: string | null }>();

    expect(error).toBeNull();
    expect(data?.decision).toBe("approved");
    expect(data?.decided_at).not.toBeNull();
  });

  it("관리자가 아니면 DomainError('not_allowed')를 던진다", async () => {
    const excuseId = await seedPendingExcuse(admin, worker.profileId);

    let caught: unknown;
    try {
      await decideExcuse(worker.client, {
        excuseId,
        approved: true,
        reason: null,
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("not_allowed");
  });
});
