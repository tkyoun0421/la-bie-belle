import type { Database } from "@/shared/api/database";
import {
  getMyExcuses,
  myExcusesKey,
} from "@/entities/attendance/dals/get-my-excuses";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  kstDate,
  kstMonthStart,
  seedAssignment,
  withFreshMonth,
  type AdminUser,
  type ApprovedUser,
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

async function openFreshDay(
  admin: AdminUser,
): Promise<{ dayId: string; workDate: string; month: string }> {
  return withFreshMonth(async (monthsFromNow) => {
    const month = kstMonthStart(monthsFromNow);
    await rpcOrThrow(admin, "create_schedule", {
      p_month: month,
      p_deadline: kstDate(1),
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
    return { dayId: data.id, workDate: month, month: month.slice(0, 7) };
  });
}

describe("getMyExcuses — 본인 사유를 그달 단위로 읽는다(AC-07)", () => {
  let admin: AdminUser;
  let owner: ApprovedUser;
  let other: ApprovedUser;

  beforeAll(async () => {
    admin = await createAdminUser();
    owner = await createApprovedUser();
    other = await createApprovedUser();
  });

  it("캐시 키는 ['excuses', 그달]이다", () => {
    expect(myExcusesKey("2026-09")).toEqual(["excuses", "2026-09"]);
  });

  it("그달 안의 본인 사유만 오고 남의 사유는 안 온다", async () => {
    const day = await openFreshDay(admin);
    seedAssignment(day.dayId, owner.profileId, "training");
    seedAssignment(day.dayId, other.profileId, "training");

    execSql(
      "insert into public.excuses (day_id, profile_id, body) values (:'day_id', :'profile_id', '내 사유');\n",
      { day_id: day.dayId, profile_id: owner.profileId },
    );
    execSql(
      "insert into public.excuses (day_id, profile_id, body) values (:'day_id', :'profile_id', '남의 사유');\n",
      { day_id: day.dayId, profile_id: other.profileId },
    );

    const excuses = await getMyExcuses(owner.client, day.month);

    expect(excuses).toHaveLength(1);
    expect(excuses[0]?.body).toBe("내 사유");
  });

  it("다른 달의 사유는 안 온다", async () => {
    const thisMonth = await openFreshDay(admin);
    seedAssignment(thisMonth.dayId, owner.profileId, "training");
    execSql(
      "insert into public.excuses (day_id, profile_id, body) values (:'day_id', :'profile_id', '이번 달 사유');\n",
      { day_id: thisMonth.dayId, profile_id: owner.profileId },
    );

    const otherMonth = await openFreshDay(admin);
    seedAssignment(otherMonth.dayId, owner.profileId, "training");
    execSql(
      "insert into public.excuses (day_id, profile_id, body) values (:'day_id', :'profile_id', '다른 달 사유');\n",
      { day_id: otherMonth.dayId, profile_id: owner.profileId },
    );

    const excuses = await getMyExcuses(owner.client, thisMonth.month);

    expect(excuses).toHaveLength(1);
    expect(excuses[0]?.body).toBe("이번 달 사유");
  });
});
