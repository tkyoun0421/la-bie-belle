import type { Database } from "@/shared/api/database";
import { DomainError } from "@/shared/api/errors";
import { confirmSchedule } from "@/entities/schedule/api/confirmSchedule.api";
import {
  backdateDeadline,
  createAdminUser,
  kstDate,
  kstMonthStart,
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

async function seedPastDeadlineSchedule(
  admin: AdminUser,
): Promise<{ month: string; scheduleId: string }> {
  return withFreshMonth(async (monthsFromNow) => {
    const month = kstMonthStart(monthsFromNow);
    await rpcOrThrow(admin, "create_schedule", {
      p_month: month,
      p_deadline: kstDate(1),
    });
    const { data, error } = await admin.client
      .from("schedules")
      .select("id")
      .eq("month", month)
      .single<{ id: string }>();
    if (error || !data) {
      throw error ?? new Error("만든 근무표를 못 찾았다");
    }
    backdateDeadline(data.id, kstDate(-1));
    return { month, scheduleId: data.id };
  });
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

describe("confirmSchedule dal — confirm_schedule을 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("마감 뒤 관리자가 부르면 confirmed_at이 찍힌다", async () => {
    const { month, scheduleId } = await seedPastDeadlineSchedule(admin);

    await confirmSchedule(admin.client, month);

    const { data, error } = await admin.client
      .from("schedules")
      .select("confirmed_at")
      .eq("id", scheduleId)
      .single<{ confirmed_at: string | null }>();
    expect(error).toBeNull();
    expect(data?.confirmed_at).not.toBeNull();
  });

  it("이미 확정된 달을 다시 확정하면 already_confirmed를 그대로 DomainError로 던진다(성공 처리는 훅 몫)", async () => {
    const { month } = await seedPastDeadlineSchedule(admin);
    await confirmSchedule(admin.client, month);

    const error = await captureDomainError(() =>
      confirmSchedule(admin.client, month),
    );

    expect(error.code).toBe("already_confirmed");
  });
});
