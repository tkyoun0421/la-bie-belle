import { randomUUID } from "node:crypto";
import type { Database } from "@/shared/api/database";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  kstDate,
  kstMonthStart,
  withFreshMonth,
  type AdminUser,
  type ApprovedUser,
} from "@tests/integration/postgres";
import { createSignedInUser } from "@tests/integration/supabase";

function randomOffset(): number {
  return 24 + Math.floor(Math.random() * 100000);
}

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

async function openFreshDay(admin: AdminUser): Promise<{
  scheduleId: string;
  dayId: string;
  slotIds: string[];
}> {
  return withFreshMonth(async (monthsFromNow) => {
    const month = kstMonthStart(monthsFromNow);
    await rpcOrThrow(admin, "create_schedule", {
      p_month: month,
      p_deadline: kstDate(1),
    });
    await rpcOrThrow(admin, "open_day", { p_work_date: month });

    const { data: day, error: dayError } = await admin.client
      .from("days")
      .select("id, schedule_id")
      .eq("work_date", month)
      .single<{ id: string; schedule_id: string }>();
    if (dayError || !day) {
      throw dayError ?? new Error("연 날을 못 찾았다");
    }

    const { data: slots, error: slotsError } = await admin.client
      .from("slots")
      .select("id")
      .eq("day_id", day.id);
    if (slotsError) {
      throw slotsError;
    }

    return {
      scheduleId: day.schedule_id,
      dayId: day.id,
      slotIds: (slots ?? []).map((slot) => (slot as { id: string }).id),
    };
  });
}

function expectSqlError(action: () => void, pattern: RegExp): void {
  let caught: unknown;
  try {
    action();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeDefined();
  const stderr = (
    caught as { stderr?: Buffer } | undefined
  )?.stderr?.toString();
  expect(stderr ?? "").toMatch(pattern);
}

const CHECK_VIOLATION = /violates check constraint/;
const UNIQUE_VIOLATION = /violates unique constraint/;

describe("근무표 표 제약과 open_slots 뷰", () => {
  let admin: AdminUser;
  let first: ApprovedUser;
  let second: ApprovedUser;

  beforeAll(async () => {
    admin = await createAdminUser();
    first = await createApprovedUser();
    second = await createApprovedUser();
  });

  describe("check 제약", () => {
    it("slots.positions가 빈 배열이면 거부된다", async () => {
      const { dayId } = await openFreshDay(admin);

      expectSqlError(
        () =>
          execSql(
            "insert into public.slots (day_id, positions) values (:'day_id', '{}');\n",
            { day_id: dayId },
          ),
        CHECK_VIOLATION,
      );
    });

    it("정규 배정인데 slot_id가 없으면 거부된다", async () => {
      const { dayId } = await openFreshDay(admin);

      expectSqlError(
        () =>
          execSql(
            "insert into public.assignments (day_id, slot_id, position, profile_id, kind) values (:'day_id', null, '안내', :'profile_id', 'regular');\n",
            { day_id: dayId, profile_id: first.profileId },
          ),
        CHECK_VIOLATION,
      );
    });

    it("교육 배정인데 slot_id가 있으면 거부된다", async () => {
      const { dayId, slotIds } = await openFreshDay(admin);

      expectSqlError(
        () =>
          execSql(
            "insert into public.assignments (day_id, slot_id, position, profile_id, kind) values (:'day_id', :'slot_id', '안내', :'profile_id', 'training');\n",
            {
              day_id: dayId,
              slot_id: slotIds[0]!,
              profile_id: first.profileId,
            },
          ),
        CHECK_VIOLATION,
      );
    });

    it("근무 요청인데 slot_id가 없으면 거부된다", async () => {
      expectSqlError(
        () =>
          execSql(
            "insert into public.requests (kind, requested_by, expires_at) values ('work', :'requested_by', now() + interval '1 day');\n",
            { requested_by: admin.profileId },
          ),
        CHECK_VIOLATION,
      );
    });

    it("교대 요청인데 assignment_id가 없으면 거부된다", async () => {
      expectSqlError(
        () =>
          execSql(
            "insert into public.requests (kind, requested_by, expires_at) values ('swap', :'requested_by', now() + interval '1 day');\n",
            { requested_by: admin.profileId },
          ),
        CHECK_VIOLATION,
      );
    });

    it("request_candidates.status가 정해진 값 밖이면 거부된다", async () => {
      const { slotIds } = await openFreshDay(admin);
      const requestId = randomUUID();
      execSql(
        "insert into public.requests (id, kind, slot_id, requested_by, expires_at) values (:'id', 'work', :'slot_id', :'requested_by', now() + interval '1 day');\n",
        {
          id: requestId,
          slot_id: slotIds[0]!,
          requested_by: admin.profileId,
        },
      );

      expectSqlError(
        () =>
          execSql(
            "insert into public.request_candidates (request_id, profile_id, status, expires_at) values (:'request_id', :'profile_id', 'bogus', now() + interval '1 day');\n",
            { request_id: requestId, profile_id: first.profileId },
          ),
        CHECK_VIOLATION,
      );
    });

    it("cancel_requests.decision이 정해진 값 밖이면 거부된다", async () => {
      const { dayId, slotIds } = await openFreshDay(admin);
      const assignmentId = randomUUID();
      execSql(
        "insert into public.assignments (id, day_id, slot_id, position, profile_id, kind) values (:'id', :'day_id', :'slot_id', '안내', :'profile_id', 'regular');\n",
        {
          id: assignmentId,
          day_id: dayId,
          slot_id: slotIds[0]!,
          profile_id: first.profileId,
        },
      );

      expectSqlError(
        () =>
          execSql(
            "insert into public.cancel_requests (assignment_id, profile_id, reason, decision) values (:'assignment_id', :'profile_id', '개인 사정', 'bogus');\n",
            { assignment_id: assignmentId, profile_id: first.profileId },
          ),
        CHECK_VIOLATION,
      );
    });
  });

  describe("unique index", () => {
    it("position_grants는 같은 사람·포지션을 두 번 못 받는다", async () => {
      execSql(
        "insert into public.position_grants (profile_id, position, granted_by) values (:'profile_id', '스캔', :'granted_by');\n",
        { profile_id: first.profileId, granted_by: admin.profileId },
      );

      expectSqlError(
        () =>
          execSql(
            "insert into public.position_grants (profile_id, position, granted_by) values (:'profile_id', '스캔', :'granted_by');\n",
            { profile_id: first.profileId, granted_by: admin.profileId },
          ),
        UNIQUE_VIOLATION,
      );
    });

    it("availabilities는 같은 사람·날짜를 두 번 못 받는다", async () => {
      const workDate = kstMonthStart(randomOffset());
      execSql(
        "insert into public.availabilities (profile_id, work_date) values (:'profile_id', :'work_date');\n",
        { profile_id: first.profileId, work_date: workDate },
      );

      expectSqlError(
        () =>
          execSql(
            "insert into public.availabilities (profile_id, work_date) values (:'profile_id', :'work_date');\n",
            { profile_id: first.profileId, work_date: workDate },
          ),
        UNIQUE_VIOLATION,
      );
    });

    it("request_candidates는 같은 요청·사람을 두 번 못 받는다", async () => {
      const { slotIds } = await openFreshDay(admin);
      const requestId = randomUUID();
      execSql(
        "insert into public.requests (id, kind, slot_id, requested_by, expires_at) values (:'id', 'work', :'slot_id', :'requested_by', now() + interval '1 day');\n",
        {
          id: requestId,
          slot_id: slotIds[0]!,
          requested_by: admin.profileId,
        },
      );
      execSql(
        "insert into public.request_candidates (request_id, profile_id, status, expires_at) values (:'request_id', :'profile_id', 'pending', now() + interval '1 day');\n",
        { request_id: requestId, profile_id: first.profileId },
      );

      expectSqlError(
        () =>
          execSql(
            "insert into public.request_candidates (request_id, profile_id, status, expires_at) values (:'request_id', :'profile_id', 'pending', now() + interval '1 day');\n",
            { request_id: requestId, profile_id: first.profileId },
          ),
        UNIQUE_VIOLATION,
      );
    });

    it("한 자리에 살아있는 정규 배정 둘째는 막힌다", async () => {
      const { dayId, slotIds } = await openFreshDay(admin);
      execSql(
        "insert into public.assignments (day_id, slot_id, position, profile_id, kind) values (:'day_id', :'slot_id', '안내', :'profile_id', 'regular');\n",
        {
          day_id: dayId,
          slot_id: slotIds[0]!,
          profile_id: first.profileId,
        },
      );

      expectSqlError(
        () =>
          execSql(
            "insert into public.assignments (day_id, slot_id, position, profile_id, kind) values (:'day_id', :'slot_id', '안내', :'profile_id', 'regular');\n",
            {
              day_id: dayId,
              slot_id: slotIds[0]!,
              profile_id: second.profileId,
            },
          ),
        UNIQUE_VIOLATION,
      );
    });

    it("한 사람이 같은 날 두 정규 자리를 못 맡는다", async () => {
      const { dayId, slotIds } = await openFreshDay(admin);
      execSql(
        "insert into public.assignments (day_id, slot_id, position, profile_id, kind) values (:'day_id', :'slot_id', '안내', :'profile_id', 'regular');\n",
        {
          day_id: dayId,
          slot_id: slotIds[0]!,
          profile_id: first.profileId,
        },
      );

      expectSqlError(
        () =>
          execSql(
            "insert into public.assignments (day_id, slot_id, position, profile_id, kind) values (:'day_id', :'slot_id', '팀장', :'profile_id', 'regular');\n",
            {
              day_id: dayId,
              slot_id: slotIds[1]!,
              profile_id: first.profileId,
            },
          ),
        UNIQUE_VIOLATION,
      );
    });

    it("교육 배정은 자리·같은 날 unique에 안 걸린다", async () => {
      const { dayId, slotIds } = await openFreshDay(admin);
      execSql(
        "insert into public.assignments (day_id, slot_id, position, profile_id, kind) values (:'day_id', :'slot_id', '안내', :'profile_id', 'regular');\n",
        {
          day_id: dayId,
          slot_id: slotIds[0]!,
          profile_id: first.profileId,
        },
      );

      expect(() =>
        execSql(
          "insert into public.assignments (day_id, slot_id, position, profile_id, kind) values (:'day_id', null, '스캔', :'profile_id', 'training');\n",
          { day_id: dayId, profile_id: first.profileId },
        ),
      ).not.toThrow();
    });
  });

  describe("open_slots 뷰", () => {
    it("배정 없는 살아있는 자리는 뜬다", async () => {
      const { slotIds } = await openFreshDay(admin);

      const { data, error } = await admin.client
        .from("open_slots")
        .select("slot_id")
        .eq("slot_id", slotIds[0]!);

      expect(error).toBeNull();
      expect(data).toEqual([{ slot_id: slotIds[0] }]);
    });

    it("정규 배정이 들어간 자리는 사라진다", async () => {
      const { dayId, slotIds } = await openFreshDay(admin);
      execSql(
        "insert into public.assignments (day_id, slot_id, position, profile_id, kind) values (:'day_id', :'slot_id', '안내', :'profile_id', 'regular');\n",
        {
          day_id: dayId,
          slot_id: slotIds[0]!,
          profile_id: first.profileId,
        },
      );

      const { data, error } = await admin.client
        .from("open_slots")
        .select("slot_id")
        .eq("slot_id", slotIds[0]!);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("교육 배정만 있는 자리는 남는다", async () => {
      const { dayId, slotIds } = await openFreshDay(admin);
      execSql(
        "insert into public.assignments (day_id, slot_id, position, profile_id, kind) values (:'day_id', null, '안내', :'profile_id', 'training');\n",
        { day_id: dayId, profile_id: first.profileId },
      );

      const { data, error } = await admin.client
        .from("open_slots")
        .select("slot_id")
        .eq("slot_id", slotIds[0]!);

      expect(error).toBeNull();
      expect(data).toEqual([{ slot_id: slotIds[0] }]);
    });

    it("security_invoker라 미승인 세션은 0행이다", async () => {
      const { slotIds } = await openFreshDay(admin);
      const unapproved = await createSignedInUser();

      const { data, error } = await unapproved.client
        .from("open_slots")
        .select("slot_id")
        .eq("slot_id", slotIds[0]!);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });
});
