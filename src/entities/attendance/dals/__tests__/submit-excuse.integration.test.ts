import { DomainError } from "@/shared/api/errors";
import { submitExcuse } from "@/entities/attendance/dals/submit-excuse";
import {
  createAdminUser,
  createApprovedUser,
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

async function openFreshDay(admin: AdminUser): Promise<{ dayId: string }> {
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
    return { dayId: data.id };
  });
}

describe("submitExcuse dal — submit_excuse를 부르고 오류를 DomainError로 올린다(AC-07)", () => {
  let admin: AdminUser;
  let worker: ApprovedUser;
  let noAssignmentWorker: ApprovedUser;

  beforeAll(async () => {
    admin = await createAdminUser();
    worker = await createApprovedUser();
    noAssignmentWorker = await createApprovedUser();
  });

  it("성공하면 excuses 행이 실제로 생긴다", async () => {
    const { dayId } = await openFreshDay(admin);
    seedAssignment(dayId, worker.profileId, "training");

    await submitExcuse(worker.client, {
      dayId,
      body: "사정이 있었다",
    });

    const { data, error } = await admin.client
      .from("excuses")
      .select("id, body")
      .eq("day_id", dayId)
      .eq("profile_id", worker.profileId);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0]?.body).toBe("사정이 있었다");
  });

  it("그날 배정이 없으면 DomainError('not_allowed')를 던진다", async () => {
    const { dayId } = await openFreshDay(admin);

    let caught: unknown;
    try {
      await submitExcuse(noAssignmentWorker.client, {
        dayId,
        body: "사정이 있었다",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("not_allowed");
  });
});
