import type { Database } from "@/shared/api/database";
import { DomainError } from "@/shared/api/errors";
import { setDayHours } from "@/entities/schedule/dals/setDayHours";
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

describe("setDayHours dal — set_day_hours를 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("관리자가 부르면 그 날의 starts_at·ends_at이 바뀐다", async () => {
    const month = await seedOpenDay(admin);

    await setDayHours(admin.client, month, "09:00", "23:00");

    const { data, error } = await admin.client
      .from("days")
      .select("starts_at, ends_at")
      .eq("work_date", month)
      .single<{ starts_at: string; ends_at: string }>();
    expect(error).toBeNull();
    expect(data?.starts_at).toMatch(/^09:00/);
    expect(data?.ends_at).toMatch(/^23:00/);
  });

  it("끝이 시작보다 이르면 bad_hours", async () => {
    const month = await seedOpenDay(admin);

    const error = await captureDomainError(() =>
      setDayHours(admin.client, month, "22:00", "10:00"),
    );

    expect(error.code).toBe("bad_hours");
  });
});
