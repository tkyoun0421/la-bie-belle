import { randomUUID } from "node:crypto";
import {
  backdateDeadline,
  createAdminUser,
  createApprovedUser,
  execSql,
  kstDate,
  kstMonthEnd,
  kstMonthStart,
  withFreshMonth,
  type AdminUser,
  type ApprovedUser,
} from "@tests/integration/postgres";

function randomOffset(): number {
  return 24 + Math.floor(Math.random() * 100000);
}

type SlotDefault = { positions: string[]; count: number };

const DEFAULT_SLOTS: SlotDefault[] = [
  { positions: ["팀장"], count: 1 },
  { positions: ["스캔"], count: 1 },
  { positions: ["메인"], count: 1 },
  { positions: ["드레스"], count: 1 },
  { positions: ["축가"], count: 1 },
  { positions: ["매니저"], count: 2 },
  { positions: ["안내"], count: 2 },
  { positions: ["드레스실"], count: 1 },
  { positions: ["대기실"], count: 1 },
];

const DEFAULT_STARTS = "10:00";
const DEFAULT_ENDS = "22:00";

function withManagerCount(count: number): SlotDefault[] {
  return DEFAULT_SLOTS.map((entry) =>
    entry.positions[0] === "매니저" ? { ...entry, count } : entry,
  );
}

async function rpcOrThrow(
  user: AdminUser,
  fn: string,
  args: Record<string, unknown>,
): Promise<void> {
  const { error } = await user.client.rpc(fn, args);
  if (error) {
    throw error;
  }
}

async function scheduleIdFor(admin: AdminUser, month: string): Promise<string> {
  const { data, error } = await admin.client
    .from("schedules")
    .select("id")
    .eq("month", month)
    .single<{ id: string }>();
  if (error || !data) {
    throw error ?? new Error("만든 근무표를 못 찾았다");
  }
  return data.id;
}

async function dayIdFor(admin: AdminUser, workDate: string): Promise<string> {
  const { data, error } = await admin.client
    .from("days")
    .select("id")
    .eq("work_date", workDate)
    .single<{ id: string }>();
  if (error || !data) {
    throw error ?? new Error("연 날을 못 찾았다");
  }
  return data.id;
}

async function seedSchedule(
  admin: AdminUser,
): Promise<{ month: string; scheduleId: string }> {
  return withFreshMonth(async (monthsFromNow) => {
    const month = kstMonthStart(monthsFromNow);
    await rpcOrThrow(admin, "create_schedule", {
      p_month: month,
      p_deadline: kstDate(1),
    });
    return { month, scheduleId: await scheduleIdFor(admin, month) };
  });
}

async function seedOpenDay(
  admin: AdminUser,
): Promise<{ month: string; scheduleId: string; dayId: string }> {
  return withFreshMonth(async (monthsFromNow) => {
    const month = kstMonthStart(monthsFromNow);
    await rpcOrThrow(admin, "create_schedule", {
      p_month: month,
      p_deadline: kstDate(1),
    });
    await rpcOrThrow(admin, "open_day", { p_work_date: month });
    return {
      month,
      scheduleId: await scheduleIdFor(admin, month),
      dayId: await dayIdFor(admin, month),
    };
  });
}

async function seedMonthPair(
  admin: AdminUser,
): Promise<{ first: string; second: string; lastOfFirst: string }> {
  return withFreshMonth(async (monthsFromNow) => {
    const first = kstMonthStart(monthsFromNow);
    const second = kstMonthStart(monthsFromNow + 1);
    await rpcOrThrow(admin, "create_schedule", {
      p_month: first,
      p_deadline: kstDate(1),
    });
    await rpcOrThrow(admin, "create_schedule", {
      p_month: second,
      p_deadline: kstDate(1),
    });
    return { first, second, lastOfFirst: kstMonthEnd(monthsFromNow) };
  });
}

function countByPosition(
  slots: { positions: string[] }[],
  position: string,
): number {
  return slots.filter(
    (slot) => slot.positions.length === 1 && slot.positions[0] === position,
  ).length;
}

function positionCounts(
  slots: { positions: string[] }[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const slot of slots) {
    const key = slot.positions.join("+");
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

async function slotsForDay(
  admin: AdminUser,
  dayId: string,
): Promise<{ id: string; positions: string[] }[]> {
  const { data, error } = await admin.client
    .from("slots")
    .select("id, positions")
    .eq("day_id", dayId);
  if (error) {
    throw error;
  }
  return (data ?? []) as { id: string; positions: string[] }[];
}

describe("근무표 함수", () => {
  let admin: AdminUser;
  let worker: ApprovedUser;
  let owner: ApprovedUser;

  beforeAll(async () => {
    admin = await createAdminUser();
    worker = await createApprovedUser();
    owner = await createApprovedUser();
  });

  describe("호출자 검사 — 근무자가 부르면 not_allowed", () => {
    it("create_schedule을 근무자가 부르면 not_allowed", async () => {
      const { error } = await worker.client.rpc("create_schedule", {
        p_month: kstMonthStart(randomOffset()),
        p_deadline: kstDate(1),
      });
      expect(error?.message).toBe("not_allowed");
    });

    it("set_application_deadline을 근무자가 부르면 not_allowed", async () => {
      const { error } = await worker.client.rpc("set_application_deadline", {
        p_month: kstMonthStart(randomOffset()),
        p_deadline: kstDate(1),
      });
      expect(error?.message).toBe("not_allowed");
    });

    it("confirm_schedule을 근무자가 부르면 not_allowed", async () => {
      const { error } = await worker.client.rpc("confirm_schedule", {
        p_month: kstMonthStart(randomOffset()),
      });
      expect(error?.message).toBe("not_allowed");
    });

    it("open_day를 근무자가 부르면 not_allowed", async () => {
      const { error } = await worker.client.rpc("open_day", {
        p_work_date: kstDate(1),
      });
      expect(error?.message).toBe("not_allowed");
    });

    it("close_day를 근무자가 부르면 not_allowed", async () => {
      const { error } = await worker.client.rpc("close_day", {
        p_work_date: kstDate(1),
      });
      expect(error?.message).toBe("not_allowed");
    });

    it("set_day_hours를 근무자가 부르면 not_allowed", async () => {
      const { error } = await worker.client.rpc("set_day_hours", {
        p_work_date: kstDate(1),
        p_starts: "10:00",
        p_ends: "22:00",
        p_ceremony: null,
      });
      expect(error?.message).toBe("not_allowed");
    });

    it("set_hall_defaults를 근무자가 부르면 not_allowed", async () => {
      const { error } = await worker.client.rpc("set_hall_defaults", {
        p_slots: DEFAULT_SLOTS,
        p_starts: "10:00",
        p_ends: "22:00",
      });
      expect(error?.message).toBe("not_allowed");
    });
  });

  describe("근무표 만들기와 마감일", () => {
    it("같은 달에 두 번 만들면 already_exists", async () => {
      const { month } = await seedSchedule(admin);

      const { error } = await admin.client.rpc("create_schedule", {
        p_month: month,
        p_deadline: kstDate(1),
      });
      expect(error?.message).toBe("already_exists");
    });

    it("마감일이 오늘 이전이면 deadline_past", async () => {
      const { error } = await admin.client.rpc("create_schedule", {
        p_month: kstMonthStart(randomOffset()),
        p_deadline: kstDate(-1),
      });
      expect(error?.message).toBe("deadline_past");
    });

    it("열 수 있는 날이 하루도 안 남은 달이면 month_over", async () => {
      const { error } = await admin.client.rpc("create_schedule", {
        p_month: kstMonthStart(-3),
        p_deadline: kstDate(1),
      });
      expect(error?.message).toBe("month_over");
    });

    it("마감 전에 확정하면 too_early", async () => {
      const { month } = await seedSchedule(admin);

      const { error } = await admin.client.rpc("confirm_schedule", {
        p_month: month,
      });
      expect(error?.message).toBe("too_early");
    });

    it("마감 뒤에는 확정이 통과하고 confirmed_at이 찍힌다", async () => {
      const { month, scheduleId } = await seedSchedule(admin);
      backdateDeadline(scheduleId, kstDate(-1));

      const { error } = await admin.client.rpc("confirm_schedule", {
        p_month: month,
      });
      expect(error).toBeNull();

      const { data } = await admin.client
        .from("schedules")
        .select("confirmed_at")
        .eq("id", scheduleId)
        .single<{ confirmed_at: string | null }>();
      expect(data?.confirmed_at).not.toBeNull();
    });

    it("이미 확정된 달을 다시 확정하면 already_confirmed", async () => {
      const { month, scheduleId } = await seedSchedule(admin);
      backdateDeadline(scheduleId, kstDate(-1));
      await rpcOrThrow(admin, "confirm_schedule", { p_month: month });

      const { error } = await admin.client.rpc("confirm_schedule", {
        p_month: month,
      });
      expect(error?.message).toBe("already_confirmed");
    });

    it("확정된 달의 마감일을 바꾸면 already_confirmed", async () => {
      const { month, scheduleId } = await seedSchedule(admin);
      backdateDeadline(scheduleId, kstDate(-1));
      await rpcOrThrow(admin, "confirm_schedule", { p_month: month });

      const { error } = await admin.client.rpc("set_application_deadline", {
        p_month: month,
        p_deadline: kstDate(1),
      });
      expect(error?.message).toBe("already_confirmed");
    });
  });

  describe("날 열기와 닫기", () => {
    it("근무표가 없는 달의 날짜를 열면 no_schedule", async () => {
      const { error } = await admin.client.rpc("open_day", {
        p_work_date: kstMonthStart(randomOffset()),
      });
      expect(error?.message).toBe("no_schedule");
    });

    it("이미 지난 날짜를 열면 date_past", async () => {
      const month = kstMonthStart(0);
      const { error: createError } = await admin.client.rpc("create_schedule", {
        p_month: month,
        p_deadline: kstDate(1),
      });
      if (createError && createError.message !== "already_exists") {
        throw createError;
      }

      const { error } = await admin.client.rpc("open_day", {
        p_work_date: month,
      });
      expect(error?.message).toBe("date_past");
    });

    it("오늘 날짜는 date_past로 거부되지 않는다", async () => {
      const month = kstMonthStart(0);
      const { error: createError } = await admin.client.rpc("create_schedule", {
        p_month: month,
        p_deadline: kstDate(1),
      });
      if (createError && createError.message !== "already_exists") {
        throw createError;
      }

      await admin.client.rpc("open_day", { p_work_date: kstDate() });

      const { data, error } = await admin.client
        .from("days")
        .select("id")
        .eq("work_date", kstDate());
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it("같은 날짜를 두 번 열면 already_open", async () => {
      const { month } = await seedOpenDay(admin);

      const { error } = await admin.client.rpc("open_day", {
        p_work_date: month,
      });
      expect(error?.message).toBe("already_open");
    });

    it("open_day 한 번에 days 하나와 slots 열한 개가 선다", async () => {
      const { month } = await seedOpenDay(admin);

      const { data: days } = await admin.client
        .from("days")
        .select("id")
        .eq("work_date", month);
      expect(days).toHaveLength(1);

      const slots = await slotsForDay(admin, days![0]!.id as string);
      expect(slots).toHaveLength(11);
    });

    it("open_day가 halls.default_slots대로 포지션별 자리 수를 깐다", async () => {
      const { dayId } = await seedOpenDay(admin);
      const slots = await slotsForDay(admin, dayId);

      expect(slots).toHaveLength(11);
      expect(positionCounts(slots)).toEqual({
        팀장: 1,
        스캔: 1,
        메인: 1,
        드레스: 1,
        축가: 1,
        매니저: 2,
        안내: 2,
        드레스실: 1,
        대기실: 1,
      });
    });

    it("연 날이 아니면 set_day_hours가 not_open", async () => {
      const { month } = await seedSchedule(admin);

      const { error } = await admin.client.rpc("set_day_hours", {
        p_work_date: month,
        p_starts: "10:00",
        p_ends: "22:00",
        p_ceremony: null,
      });
      expect(error?.message).toBe("not_open");
    });

    it("끝이 시작보다 이르면 bad_hours", async () => {
      const { month } = await seedOpenDay(admin);

      const { error } = await admin.client.rpc("set_day_hours", {
        p_work_date: month,
        p_starts: "22:00",
        p_ends: "10:00",
        p_ceremony: null,
      });
      expect(error?.message).toBe("bad_hours");
    });

    it("확정 뒤에는 close_day가 already_confirmed", async () => {
      const { month, scheduleId } = await seedOpenDay(admin);
      backdateDeadline(scheduleId, kstDate(-1));
      await rpcOrThrow(admin, "confirm_schedule", { p_month: month });

      const { error } = await admin.client.rpc("close_day", {
        p_work_date: month,
      });
      expect(error?.message).toBe("already_confirmed");
    });

    it("close_day가 days를 지우면 slots와 그 자리의 requests도 같이 사라진다", async () => {
      const { month, dayId } = await seedOpenDay(admin);
      const slots = await slotsForDay(admin, dayId);
      const slotId = slots[0]!.id;

      const assignmentId = randomUUID();
      execSql(
        "insert into public.assignments (id, day_id, slot_id, position, profile_id, kind) values (:'id', :'day_id', :'slot_id', '안내', :'profile_id', 'regular');\n",
        {
          id: assignmentId,
          day_id: dayId,
          slot_id: slotId,
          profile_id: owner.profileId,
        },
      );

      const requestId = randomUUID();
      execSql(
        "insert into public.requests (id, kind, slot_id, requested_by, expires_at) values (:'id', 'work', :'slot_id', :'requested_by', now() + interval '2 day');\n",
        { id: requestId, slot_id: slotId, requested_by: admin.profileId },
      );

      const { error } = await admin.client.rpc("close_day", {
        p_work_date: month,
      });
      expect(error).toBeNull();

      const { data: daysAfter } = await admin.client
        .from("days")
        .select("id")
        .eq("id", dayId);
      expect(daysAfter).toEqual([]);

      const { data: slotsAfter } = await admin.client
        .from("slots")
        .select("id")
        .eq("id", slotId);
      expect(slotsAfter).toEqual([]);

      const { data: assignmentsAfter } = await admin.client
        .from("assignments")
        .select("id")
        .eq("id", assignmentId);
      expect(assignmentsAfter).toEqual([]);

      const { data: requestsAfter } = await admin.client
        .from("requests")
        .select("id")
        .eq("id", requestId);
      expect(requestsAfter).toEqual([]);
    });
  });

  describe("달 경계", () => {
    it("달을 걸친 날짜 둘이 서로 다른 schedules 행에 붙는다", async () => {
      const {
        first: monthA,
        second: monthB,
        lastOfFirst: lastDayOfMonthA,
      } = await seedMonthPair(admin);

      const scheduleAId = await scheduleIdFor(admin, monthA);
      const scheduleBId = await scheduleIdFor(admin, monthB);

      await rpcOrThrow(admin, "open_day", { p_work_date: lastDayOfMonthA });
      await rpcOrThrow(admin, "open_day", { p_work_date: monthB });

      const { data: dayA } = await admin.client
        .from("days")
        .select("schedule_id")
        .eq("work_date", lastDayOfMonthA)
        .single<{ schedule_id: string }>();
      const { data: dayB } = await admin.client
        .from("days")
        .select("schedule_id")
        .eq("work_date", monthB)
        .single<{ schedule_id: string }>();

      expect(dayA?.schedule_id).toBe(scheduleAId);
      expect(dayB?.schedule_id).toBe(scheduleBId);
      expect(dayA?.schedule_id).not.toBe(dayB?.schedule_id);
    });
  });

  describe("홀 기본값", () => {
    afterAll(async () => {
      await rpcOrThrow(admin, "set_hall_defaults", {
        p_slots: DEFAULT_SLOTS,
        p_starts: DEFAULT_STARTS,
        p_ends: DEFAULT_ENDS,
      });
    });

    it("set_hall_defaults는 이미 연 날에 소급하지 않는다", async () => {
      const { first: monthA, second: monthB } = await seedMonthPair(admin);
      await rpcOrThrow(admin, "open_day", { p_work_date: monthA });

      const dayIdA = await dayIdFor(admin, monthA);
      const beforeSlots = await slotsForDay(admin, dayIdA);
      expect(countByPosition(beforeSlots, "매니저")).toBe(2);

      const { error: defaultsError } = await admin.client.rpc(
        "set_hall_defaults",
        {
          p_slots: withManagerCount(3),
          p_starts: "09:00",
          p_ends: "23:00",
        },
      );
      expect(defaultsError).toBeNull();

      const afterOldDaySlots = await slotsForDay(admin, dayIdA);
      expect(countByPosition(afterOldDaySlots, "매니저")).toBe(2);

      await rpcOrThrow(admin, "open_day", { p_work_date: monthB });

      const dayIdB = await dayIdFor(admin, monthB);
      const newDaySlots = await slotsForDay(admin, dayIdB);
      expect(countByPosition(newDaySlots, "매니저")).toBe(3);
    });
  });
});
