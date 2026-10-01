import type { Database } from "@/shared/api/database";
import { DomainError } from "@/shared/api/errors";
import { setAdjustment } from "@/features/payroll/api/setAdjustment.api";
import {
  createAdminUser,
  createApprovedUser,
  kstDate,
  kstMonthStart,
  seedAssignment,
  withFreshMonth,
  type AdminUser,
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

async function seedOpenDay(admin: AdminUser): Promise<string> {
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
    return data.id;
  });
}

type QueryResult<T> = { data: T[] | null; error: { message: string } | null };

function adjustmentRows(
  admin: AdminUser,
  dayId: string,
  profileId: string,
): Promise<QueryResult<{ minutes: number }>> {
  return (
    admin.client as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (
            column: string,
            value: string,
          ) => {
            eq: (
              column: string,
              value: string,
            ) => {
              order: (
                column: string,
              ) => Promise<QueryResult<{ minutes: number }>>;
            };
          };
        };
      };
    }
  )
    .from("adjustments")
    .select("minutes")
    .eq("day_id", dayId)
    .eq("profile_id", profileId)
    .order("adjusted_at");
}

async function captureDomainError(
  run: () => Promise<unknown>,
): Promise<DomainError> {
  try {
    await run();
  } catch (error) {
    if (error instanceof DomainError) {
      return error;
    }
    throw error;
  }
  throw new Error("에러가 나지 않았다");
}

describe("setAdjustment dal(plan AC-07) — set_adjustment를 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("관리자가 부르면 새 조정 행이 선다 — 두 번째 호출도 행을 더한다(이력)", async () => {
    const worker = await createApprovedUser();
    const dayId = await seedOpenDay(admin);
    seedAssignment(dayId, worker.profileId, "regular");

    await setAdjustment(admin.client, {
      dayId,
      profileId: worker.profileId,
      minutes: 30,
      reason: "연장",
    });
    await setAdjustment(admin.client, {
      dayId,
      profileId: worker.profileId,
      minutes: -540,
      reason: "결근",
    });

    const { data, error } = await adjustmentRows(
      admin,
      dayId,
      worker.profileId,
    );
    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data?.[1]?.minutes).toBe(-540);
  });

  it("그날 그 사람의 살아 있는 배정이 없으면 not_allowed", async () => {
    const worker = await createApprovedUser();
    const dayId = await seedOpenDay(admin);

    const error = await captureDomainError(() =>
      setAdjustment(admin.client, {
        dayId,
        profileId: worker.profileId,
        minutes: 30,
        reason: "연장",
      }),
    );

    expect(error.code).toBe("not_allowed");
  });

  it("관리자가 아니면 not_allowed", async () => {
    const worker = await createApprovedUser();
    const dayId = await seedOpenDay(admin);
    seedAssignment(dayId, worker.profileId, "regular");

    const error = await captureDomainError(() =>
      setAdjustment(worker.client, {
        dayId,
        profileId: worker.profileId,
        minutes: 30,
        reason: "연장",
      }),
    );

    expect(error.code).toBe("not_allowed");
  });
});
