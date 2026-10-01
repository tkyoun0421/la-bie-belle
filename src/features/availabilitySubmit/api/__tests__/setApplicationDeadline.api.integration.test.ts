import type { Database } from "@/shared/api/database";
import { DomainError } from "@/shared/model/error.type";
import { setApplicationDeadline } from "@/features/availabilitySubmit/api/setApplicationDeadline.api";
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

function randomMonthWithoutSchedule(): string {
  const offset = 24 + Math.floor(Math.random() * 90000);
  return kstMonthStart(offset);
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

describe("setApplicationDeadline dal — set_application_deadline을 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("관리자가 부르면 application_deadline이 바뀐다", async () => {
    await withFreshMonth(async (monthsFromNow) => {
      const month = kstMonthStart(monthsFromNow);
      await rpcOrThrow(admin, "create_schedule", {
        p_month: month,
        p_deadline: kstDate(1),
      });

      await setApplicationDeadline(admin.client, month, kstDate(2));

      const { data, error } = await admin.client
        .from("schedules")
        .select("application_deadline")
        .eq("month", month)
        .single<{ application_deadline: string | null }>();
      expect(error).toBeNull();
      expect(data?.application_deadline).toBe(kstDate(2));
    });
  });

  it("그 달 근무표가 없으면 no_schedule", async () => {
    const month = randomMonthWithoutSchedule();

    const error = await captureDomainError(() =>
      setApplicationDeadline(admin.client, month, kstDate(1)),
    );

    expect(error.code).toBe("no_schedule");
  });
});
