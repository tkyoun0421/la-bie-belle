import { DomainError } from "@/shared/api/errors";
import { createSchedule } from "@/entities/schedule/api/createSchedule.api";
import {
  createAdminUser,
  kstDate,
  kstMonthStart,
  withFreshMonth,
  type AdminUser,
} from "@tests/integration/postgres";

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

describe("createSchedule dal — create_schedule을 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("관리자가 부르면 schedules 행이 선다", async () => {
    await withFreshMonth(async (monthsFromNow) => {
      const month = kstMonthStart(monthsFromNow);

      await createSchedule(admin.client, month, kstDate(1));

      const { data, error } = await admin.client
        .from("schedules")
        .select("id, application_deadline")
        .eq("month", month)
        .single<{ id: string; application_deadline: string | null }>();
      expect(error).toBeNull();
      expect(data?.application_deadline).toBe(kstDate(1));
    });
  });

  it("같은 달에 두 번 만들면 already_exists", async () => {
    await withFreshMonth(async (monthsFromNow) => {
      const month = kstMonthStart(monthsFromNow);
      await createSchedule(admin.client, month, kstDate(1));

      const error = await captureDomainError(() =>
        createSchedule(admin.client, month, kstDate(1)),
      );

      expect(error.code).toBe("already_exists");
    });
  });
});
