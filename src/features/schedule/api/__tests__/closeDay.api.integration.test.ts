import type { Database } from "@/shared/api/database";
import { DomainError } from "@/shared/api/errors";
import { closeDay } from "@/entities/schedule/api/closeDay.api";
import {
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

async function seedOpenDay(admin: AdminUser): Promise<string> {
  return withFreshMonth(async (monthsFromNow) => {
    const month = kstMonthStart(monthsFromNow);
    await rpcOrThrow(admin, "create_schedule", {
      p_month: month,
      p_deadline: kstDate(1),
    });
    await rpcOrThrow(admin, "open_day", { p_work_date: month });
    return month;
  });
}

async function seedSchedule(admin: AdminUser): Promise<string> {
  return withFreshMonth(async (monthsFromNow) => {
    const month = kstMonthStart(monthsFromNow);
    await rpcOrThrow(admin, "create_schedule", {
      p_month: month,
      p_deadline: kstDate(1),
    });
    return month;
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

describe("closeDay dal — close_day를 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("관리자가 부르면 그 날 days 행이 사라진다", async () => {
    const month = await seedOpenDay(admin);

    await closeDay(admin.client, month);

    const { data, error } = await admin.client
      .from("days")
      .select("id")
      .eq("work_date", month);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("안 연 날짜를 닫으면 not_open", async () => {
    const month = await seedSchedule(admin);

    const error = await captureDomainError(() => closeDay(admin.client, month));

    expect(error.code).toBe("not_open");
  });
});
