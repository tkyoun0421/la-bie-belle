import { DomainError } from "@/shared/api/errors";
import { markLeave } from "@/features/memberAdmin/api/markLeave.api";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  kstDate,
  kstMonthStart,
  seedAssignment,
  seedDayEndedHoursAgo,
  withFreshMonth,
  withOnlyAdmin,
  type AdminUser,
} from "@tests/integration/postgres";

async function seedFutureDay(admin: AdminUser): Promise<{ dayId: string }> {
  return withFreshMonth(async (monthsFromNow) => {
    const month = kstMonthStart(monthsFromNow);

    const created = await admin.client.rpc("create_schedule", {
      p_month: month,
      p_deadline: kstDate(1),
    });
    if (created.error) {
      throw created.error;
    }

    const opened = await admin.client.rpc("open_day", { p_work_date: month });
    if (opened.error) {
      throw opened.error;
    }

    const { data, error } = await admin.client
      .from("days")
      .select("id")
      .eq("work_date", month)
      .single<{ id: string }>();
    if (error || !data) {
      throw error ?? new Error("연 미래 날짜를 못 찾았다");
    }

    return { dayId: data.id };
  });
}

async function leftAtOf(
  admin: AdminUser,
  profileId: string,
): Promise<string | null> {
  const { data, error } = await admin.client
    .from("profiles")
    .select("left_at")
    .eq("id", profileId)
    .single<{ left_at: string | null }>();
  if (error) {
    throw error;
  }
  return data?.left_at ?? null;
}

describe("markLeave dal — mark_leave를 부르고 오류를 DomainError로 올린다", () => {
  it("배정이 없는 재직자를 퇴사 처리하면 left_at이 찍힌다", async () => {
    const admin = await createAdminUser();
    const member = await createApprovedUser();

    await markLeave(admin.client, member.profileId);

    expect(await leftAtOf(admin, member.profileId)).not.toBeNull();
  });

  it("미래 배정이 있으면 DomainError('has_future_assignments')를 던진다", async () => {
    const admin = await createAdminUser();
    const member = await createApprovedUser();
    const { dayId } = await seedFutureDay(admin);
    seedAssignment(dayId, member.profileId);

    let caught: unknown;
    try {
      await markLeave(admin.client, member.profileId);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("has_future_assignments");
  });

  it("지난 배정만 있으면 퇴사 처리가 통과한다", async () => {
    const admin = await createAdminUser();
    const member = await createApprovedUser();
    const pastDay = await seedDayEndedHoursAgo(admin, 48);
    seedAssignment(pastDay.dayId, member.profileId);

    await markLeave(admin.client, member.profileId);

    expect(await leftAtOf(admin, member.profileId)).not.toBeNull();
  });

  it("미래 배정이어도 이미 끝난(ended_at 있는) 배정이면 퇴사 처리가 통과한다", async () => {
    const admin = await createAdminUser();
    const member = await createApprovedUser();
    const { dayId } = await seedFutureDay(admin);
    const assignmentId = seedAssignment(dayId, member.profileId);
    execSql(
      "update public.assignments set ended_at = now() where id = :'assignment_id';\n",
      { assignment_id: assignmentId },
    );

    await markLeave(admin.client, member.profileId);

    expect(await leftAtOf(admin, member.profileId)).not.toBeNull();
  });

  it("마지막 관리자를 퇴사 처리하려 하면 DomainError('last_admin')을 던진다", async () => {
    const admin = await createAdminUser();

    await withOnlyAdmin(admin.profileId, async () => {
      let caught: unknown;
      try {
        await markLeave(admin.client, admin.profileId);
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(DomainError);
      expect((caught as DomainError).code).toBe("last_admin");
    });
  });

  it("관리자가 아니면 DomainError('not_allowed')를 던진다", async () => {
    const nonAdmin = await createApprovedUser();
    const member = await createApprovedUser();

    let caught: unknown;
    try {
      await markLeave(nonAdmin.client, member.profileId);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("not_allowed");
  });
});
