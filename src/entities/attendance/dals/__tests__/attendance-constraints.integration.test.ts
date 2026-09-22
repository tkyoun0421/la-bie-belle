import { randomUUID } from "node:crypto";
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

async function rpcOrThrow(
  admin: AdminUser,
  fn: string,
  args: Record<string, unknown>,
): Promise<void> {
  const { error } = await admin.client.rpc(fn, args);
  if (error) {
    throw error;
  }
}

async function openFreshDay(
  admin: AdminUser,
): Promise<{ dayId: string; scheduleId: string }> {
  return withFreshMonth(async (monthsFromNow) => {
    const month = kstMonthStart(monthsFromNow);
    await rpcOrThrow(admin, "create_schedule", {
      p_month: month,
      p_deadline: kstDate(1),
    });
    await rpcOrThrow(admin, "open_day", { p_work_date: month });

    const { data, error } = await admin.client
      .from("days")
      .select("id, schedule_id")
      .eq("work_date", month)
      .single<{ id: string; schedule_id: string }>();
    if (error || !data) {
      throw error ?? new Error("연 날을 못 찾았다");
    }
    return { dayId: data.id, scheduleId: data.schedule_id };
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

describe("출근 인증 표 제약", () => {
  let admin: AdminUser;
  let worker: ApprovedUser;
  let extraHallId: string | undefined;

  beforeAll(async () => {
    admin = await createAdminUser();
    worker = await createApprovedUser();
  });

  afterEach(() => {
    if (extraHallId) {
      execSql("delete from public.halls where id = :'id';\n", {
        id: extraHallId,
      });
      extraHallId = undefined;
    }
  });

  describe("check_ins", () => {
    it("method가 location·qr 밖이면 거부된다", async () => {
      const { dayId } = await openFreshDay(admin);
      const now = new Date().toISOString();

      expectSqlError(
        () =>
          execSql(
            "insert into public.check_ins (day_id, profile_id, checked_at, reported_at, received_at, method) values (:'day_id', :'profile_id', :'now', :'now', :'now', 'bogus');\n",
            { day_id: dayId, profile_id: worker.profileId, now },
          ),
        CHECK_VIOLATION,
      );
    });

    it("한 사람이 그날 두 번 인증을 못 남긴다", async () => {
      const { dayId } = await openFreshDay(admin);
      const now = new Date().toISOString();
      execSql(
        "insert into public.check_ins (day_id, profile_id, checked_at, reported_at, received_at, method) values (:'day_id', :'profile_id', :'now', :'now', :'now', 'location');\n",
        { day_id: dayId, profile_id: worker.profileId, now },
      );

      expectSqlError(
        () =>
          execSql(
            "insert into public.check_ins (day_id, profile_id, checked_at, reported_at, received_at, method) values (:'day_id', :'profile_id', :'now', :'now', :'now', 'qr');\n",
            { day_id: dayId, profile_id: worker.profileId, now },
          ),
        UNIQUE_VIOLATION,
      );
    });
  });

  describe("excuses", () => {
    it("decision이 approved·rejected 밖이면 거부된다", async () => {
      const { dayId } = await openFreshDay(admin);

      expectSqlError(
        () =>
          execSql(
            "insert into public.excuses (day_id, profile_id, body, decision) values (:'day_id', :'profile_id', '사정이 있었다', 'bogus');\n",
            { day_id: dayId, profile_id: worker.profileId },
          ),
        CHECK_VIOLATION,
      );
    });

    it("같은 사람·같은 날이라도 사유 행을 두 개 낼 수 있다 — unique를 안 건다", async () => {
      const { dayId } = await openFreshDay(admin);

      expect(() => {
        execSql(
          "insert into public.excuses (day_id, profile_id, body) values (:'day_id', :'profile_id', '첫 사유');\n",
          { day_id: dayId, profile_id: worker.profileId },
        );
        execSql(
          "insert into public.excuses (day_id, profile_id, body) values (:'day_id', :'profile_id', '둘째 사유');\n",
          { day_id: dayId, profile_id: worker.profileId },
        );
      }).not.toThrow();

      const { data, error } = await admin.client
        .from("excuses")
        .select("id")
        .eq("day_id", dayId)
        .eq("profile_id", worker.profileId);
      expect(error).toBeNull();
      expect(data).toHaveLength(2);
    });
  });

  describe("hall_secrets", () => {
    it("qr_code가 두 홀에 겹치면 거부된다", async () => {
      extraHallId = randomUUID();
      execSql(
        "insert into public.halls (id, lat, lng, radius_m, default_slots, default_starts, default_ends) values (:'id', 37.1, 127.1, 200, '[]'::jsonb, '10:00', '22:00');\n",
        { id: extraHallId },
      );

      const { data: hall } = await admin.client
        .from("halls")
        .select("id")
        .neq("id", extraHallId)
        .single<{ id: string }>();
      const baseHallId = hall!.id;

      // 다른 파일이 rotate_qr로 이미 세워둔 행이 있을 수 있다. 여기서 보려는 것은
      // qr_code 겹침이라 기준 홀의 행은 덮어써서 값만 맞춘다.
      const sharedCode = randomUUID();
      execSql(
        "insert into public.hall_secrets (hall_id, qr_code) values (:'hall_id', :'qr_code') on conflict (hall_id) do update set qr_code = excluded.qr_code;\n",
        { hall_id: baseHallId, qr_code: sharedCode },
      );

      expectSqlError(
        () =>
          execSql(
            "insert into public.hall_secrets (hall_id, qr_code) values (:'hall_id', :'qr_code');\n",
            { hall_id: extraHallId!, qr_code: sharedCode },
          ),
        UNIQUE_VIOLATION,
      );

      execSql("delete from public.hall_secrets where hall_id = :'hall_id';\n", {
        hall_id: baseHallId,
      });
    });
  });
});
