import { queryKeys } from "@/shared/api/queryKeys";
import { getFirstScheduleMonth } from "@/entities/schedule/dals/getFirstScheduleMonth";
import {
  createAdminUser,
  execSql,
  type AdminUser,
} from "@tests/integration/postgres";

function seedScheduleAt(month: string, createdBy: string): void {
  execSql(
    "insert into public.schedules (month, created_by) values (:'month', :'created_by');\n",
    { month, created_by: createdBy },
  );
}

function removeSchedule(month: string): void {
  execSql("delete from public.schedules where month = :'month';\n", {
    month,
  });
}

describe("getFirstScheduleMonth — schedules의 가장 이른 month 한 줄을 낸다(stats-admin 「뒤로 가는 바닥」)", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("캐시 키는 ['schedule', 'first-month']다 — 달을 안 물어 새 달이 생겨도 그대로 낡는다", () => {
    expect(queryKeys.schedule.firstMonth()).toEqual([
      "schedule",
      "first-month",
    ]);
  });

  it("달이 여럿이면 그중 가장 이른 것을 낸다", async () => {
    const earliest = "0001-06-01";
    const later = "0003-11-01";
    seedScheduleAt(earliest, admin.profileId);
    seedScheduleAt(later, admin.profileId);

    try {
      const result = await getFirstScheduleMonth(admin.client);

      expect(result).toBe(earliest);
    } finally {
      removeSchedule(earliest);
      removeSchedule(later);
    }
  });

  it("가장 이른 달이 새로 하나 생기면 그 값을 낸다", async () => {
    const only = "0002-09-01";
    seedScheduleAt(only, admin.profileId);

    try {
      const result = await getFirstScheduleMonth(admin.client);

      expect(result).toBe(only);
    } finally {
      removeSchedule(only);
    }
  });
});
