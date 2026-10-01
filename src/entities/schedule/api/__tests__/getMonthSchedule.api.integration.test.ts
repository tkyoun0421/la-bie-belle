import { randomUUID } from "node:crypto";
import type { Database } from "@/shared/api/database";
import { getMonthSchedule } from "@/entities/schedule/dals/getMonthSchedule";
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

type SeededDay = { month: string; dayId: string; workDate: string };

async function seedOpenDay(admin: AdminUser): Promise<SeededDay> {
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

    return { month: workDate.slice(0, 7), dayId: data.id, workDate };
  });
}

function setDisplayName(profileId: string, displayName: string): void {
  execSql(
    "update public.profiles set display_name = :'display_name' where id = :'profile_id';\n",
    { profile_id: profileId, display_name: displayName },
  );
}

function seedCheckIn(
  dayId: string,
  profileId: string,
): { id: string; checkedAt: string } {
  const id = randomUUID();
  const checkedAt = new Date().toISOString();
  execSql(
    [
      "insert into public.check_ins",
      "(id, day_id, profile_id, checked_at, reported_at, received_at, method)",
      "values (:'id', :'day_id', :'profile_id', :'checked_at', :'checked_at', :'checked_at', 'qr');",
    ].join(" ") + "\n",
    { id, day_id: dayId, profile_id: profileId, checked_at: checkedAt },
  );
  return { id, checkedAt };
}

describe("getMonthSchedule — 근무표 한 달을 days·slots·assignments로 읽는다(SCH-019)", () => {
  let admin: AdminUser;
  let worker: ApprovedUser;
  let owner: ApprovedUser;

  beforeAll(async () => {
    admin = await createAdminUser();
    worker = await createApprovedUser();
    owner = await createApprovedUser();
  });

  it("근무자 세션에서도 배정에 임베드된 profiles.display_name이 온다", async () => {
    const { month, dayId } = await seedOpenDay(admin);
    setDisplayName(owner.profileId, "초록잎");
    seedAssignment(dayId, owner.profileId, "training");

    const days = await getMonthSchedule(worker.client, month);

    const day = days.find((row) => row.id === dayId);
    expect(day).toBeDefined();

    const assignment = day?.assignments.find(
      (row) => row.profile_id === owner.profileId,
    );
    expect(assignment?.profiles?.display_name).toBe("초록잎");
  });

  it("그 달 밖의 날은 안 온다", async () => {
    const inMonth = await seedOpenDay(admin);
    const otherMonth = await seedOpenDay(admin);

    const days = await getMonthSchedule(worker.client, inMonth.month);

    expect(days.some((row) => row.id === inMonth.dayId)).toBe(true);
    expect(days.some((row) => row.id === otherMonth.dayId)).toBe(false);
  });
});

describe("getMonthSchedule — days에 check_ins가 임베딩된다(design.md 「행위 밖의 실행 동작」)", () => {
  let admin: AdminUser;
  let worker: ApprovedUser;
  let owner: ApprovedUser;

  beforeAll(async () => {
    admin = await createAdminUser();
    worker = await createApprovedUser();
    owner = await createApprovedUser();
  });

  it("관리자 세션에 check_ins 행이 함께 온다", async () => {
    const { month, dayId } = await seedOpenDay(admin);
    const { id, checkedAt } = seedCheckIn(dayId, owner.profileId);

    const days = await getMonthSchedule(admin.client, month);
    const day = days.find((row) => row.id === dayId);

    expect(day?.check_ins).toEqual([
      expect.objectContaining({
        id,
        profile_id: owner.profileId,
        checked_at: expect.any(String),
      }),
    ]);
    expect(new Date(day!.check_ins[0].checked_at).getTime()).toBe(
      new Date(checkedAt).getTime(),
    );
  });

  it("근무자 세션에도 check_ins 행이 함께 온다(RLS는 is_approved)", async () => {
    const { month, dayId } = await seedOpenDay(admin);
    const { id } = seedCheckIn(dayId, owner.profileId);

    const days = await getMonthSchedule(worker.client, month);
    const day = days.find((row) => row.id === dayId);

    expect(day?.check_ins?.map((row) => row.id)).toEqual([id]);
  });
});

describe("getMonthSchedule — assignments에 id·slot_id·kind가 온다(schedule-assign)", () => {
  let admin: AdminUser;
  let owner: ApprovedUser;

  beforeAll(async () => {
    admin = await createAdminUser();
    owner = await createApprovedUser();
  });

  it("정규 배정은 slot_id가 그 자리의 id다", async () => {
    const { month, dayId } = await seedOpenDay(admin);
    const { data: slots, error: slotsError } = await admin.client
      .from("slots")
      .select("id")
      .eq("day_id", dayId)
      .limit(1);
    if (slotsError || !slots || slots.length === 0) {
      throw slotsError ?? new Error("자리를 못 찾았다");
    }
    const slotId = (slots[0] as { id: string }).id;
    const assignmentId = seedAssignment(
      dayId,
      owner.profileId,
      "regular",
      slotId,
    );

    const days = await getMonthSchedule(admin.client, month);
    const day = days.find((row) => row.id === dayId);
    const assignment = day?.assignments.find((row) => row.id === assignmentId);

    expect(assignment?.slot_id).toBe(slotId);
    expect(assignment?.kind).toBe("regular");
  });

  it("교육 배정은 slot_id가 null이다", async () => {
    const { month, dayId } = await seedOpenDay(admin);
    const assignmentId = seedAssignment(dayId, owner.profileId, "training");

    const days = await getMonthSchedule(admin.client, month);
    const day = days.find((row) => row.id === dayId);
    const assignment = day?.assignments.find((row) => row.id === assignmentId);

    expect(assignment?.slot_id).toBeNull();
    expect(assignment?.kind).toBe("training");
  });
});
