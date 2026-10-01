import type { Database } from "@/shared/api/database";
import { DomainError } from "@/shared/api/errors";
import { openDay } from "@/entities/schedule/dals/open-day";
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

describe("openDay dal — open_day를 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("관리자가 부르면 days 하나와 slots 열한 개가 선다", async () => {
    const month = await seedSchedule(admin);

    await openDay(admin.client, month);

    const { data: days, error: daysError } = await admin.client
      .from("days")
      .select("id")
      .eq("work_date", month);
    expect(daysError).toBeNull();
    expect(days).toHaveLength(1);

    const { data: slots, error: slotsError } = await admin.client
      .from("slots")
      .select("id")
      .eq("day_id", days![0]!.id as string);
    expect(slotsError).toBeNull();
    expect(slots).toHaveLength(11);
  });

  it("같은 날짜를 두 번 열면 already_open", async () => {
    const month = await seedSchedule(admin);
    await openDay(admin.client, month);

    const error = await captureDomainError(() => openDay(admin.client, month));

    expect(error.code).toBe("already_open");
  });
});
