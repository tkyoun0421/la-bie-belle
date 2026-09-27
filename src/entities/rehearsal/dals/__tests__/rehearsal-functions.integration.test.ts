import { randomUUID } from "node:crypto";
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
import { createSignedInUser } from "@tests/integration/supabase";

type RpcCaller = { client: AdminUser["client"] };
type RpcOutcome = { data: unknown; error: { message: string } | null };

function rpc(
  user: RpcCaller,
  fn: string,
  args: Record<string, unknown>,
): Promise<RpcOutcome> {
  return (
    user.client as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<RpcOutcome>;
    }
  ).rpc(fn, args);
}

async function rpcOrThrow(
  user: RpcCaller,
  fn: string,
  args: Record<string, unknown>,
): Promise<void> {
  const { error } = await rpc(user, fn, args);
  if (error) {
    throw new Error(error.message);
  }
}

function freshWorkDate(): string {
  return kstMonthStart(24 + Math.floor(Math.random() * 90000));
}

function grantRehearsal(profileId: string, grantedBy: string): void {
  execSql(
    "insert into public.position_grants (profile_id, position, granted_by) values (:'profile_id', '리허설', :'granted_by');\n",
    { profile_id: profileId, granted_by: grantedBy },
  );
}

function revokeRehearsal(profileId: string): void {
  execSql(
    "delete from public.position_grants where profile_id = :'profile_id' and position = '리허설';\n",
    { profile_id: profileId },
  );
}

function seedTimeRehearsal(
  profileId: string,
  workDate: string,
  startsAt: string,
  endsAt: string,
): string {
  const id = randomUUID();
  execSql(
    "insert into public.rehearsals (id, profile_id, work_date, starts_at, ends_at) values (:'id', :'profile_id', :'work_date', :'starts_at', :'ends_at');\n",
    {
      id,
      profile_id: profileId,
      work_date: workDate,
      starts_at: startsAt,
      ends_at: endsAt,
    },
  );
  return id;
}

async function seedDayWithSlot(admin: AdminUser): Promise<{
  workDate: string;
  dayId: string;
  slotId: string;
}> {
  return withFreshMonth(async (monthsFromNow) => {
    const workDate = kstMonthStart(monthsFromNow);
    await rpcOrThrow(admin, "create_schedule", {
      p_month: workDate,
      p_deadline: kstDate(1),
    });
    await rpcOrThrow(admin, "open_day", { p_work_date: workDate });

    const { data: day, error: dayError } = await admin.client
      .from("days")
      .select("id")
      .eq("work_date", workDate)
      .single<{ id: string }>();
    if (dayError || !day) {
      throw dayError ?? new Error("연 날을 못 찾았다");
    }

    const { data: slots, error: slotsError } = await admin.client
      .from("slots")
      .select("id, positions")
      .eq("day_id", day.id);
    if (slotsError) {
      throw slotsError;
    }
    const slot = (slots as { id: string; positions: string[] }[]).find(
      (candidate) => candidate.positions.length === 1,
    );
    if (!slot) {
      throw new Error("빈 자리를 못 찾았다");
    }

    return { workDate, dayId: day.id, slotId: slot.id };
  });
}

async function countRowsFor(
  admin: AdminUser,
  profileId: string,
  workDate: string,
): Promise<number> {
  const { data, error } = await admin.client
    .from("rehearsals")
    .select("id")
    .eq("profile_id", profileId)
    .eq("work_date", workDate);
  if (error) {
    throw error;
  }
  return (data ?? []).length;
}

describe("리허설 함수 셋 — add_rehearsal · edit_rehearsal · remove_rehearsal(plan AC-03)", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  describe("검사 순서 — not_allowed 다음 not_qualified", () => {
    it("승인 안 된 사람이 부르면 not_allowed", async () => {
      const unapproved = await createSignedInUser();

      const { error } = await rpc(unapproved, "add_rehearsal", {
        p_work_date: freshWorkDate(),
        p_starts_at: "14:00",
        p_ends_at: "16:00",
      });

      expect(error?.message).toBe("not_allowed");
    });

    it("승인은 됐지만 리허설 자격이 없으면 not_qualified", async () => {
      const worker = await createApprovedUser();

      const { error } = await rpc(worker, "add_rehearsal", {
        p_work_date: freshWorkDate(),
        p_starts_at: "14:00",
        p_ends_at: "16:00",
      });

      expect(error?.message).toBe("not_qualified");
    });
  });

  describe("갈래 판정 — 화면이 보낸 갈래를 안 믿고 그날 살아 있는 정규 배정으로 다시 정한다", () => {
    it("배정 없는 날에 건수를 보내면 wrong_kind", async () => {
      const worker = await createApprovedUser();
      grantRehearsal(worker.profileId, admin.profileId);

      const { error } = await rpc(worker, "add_rehearsal", {
        p_work_date: freshWorkDate(),
        p_count: 2,
      });

      expect(error?.message).toBe("wrong_kind");
    });

    it("살아 있는 정규 배정이 있는 날에 시각을 보내면 wrong_kind", async () => {
      const worker = await createApprovedUser();
      grantRehearsal(worker.profileId, admin.profileId);
      const { workDate, dayId, slotId } = await seedDayWithSlot(admin);
      seedAssignment(dayId, worker.profileId, "regular", slotId);

      const { error } = await rpc(worker, "add_rehearsal", {
        p_work_date: workDate,
        p_starts_at: "14:00",
        p_ends_at: "16:00",
      });

      expect(error?.message).toBe("wrong_kind");
    });

    it("교육 배정만 있는 날은 시각 갈래다 — 건수를 보내면 wrong_kind", async () => {
      const worker = await createApprovedUser();
      grantRehearsal(worker.profileId, admin.profileId);
      const { workDate, dayId } = await seedDayWithSlot(admin);
      seedAssignment(dayId, worker.profileId, "training", null);

      const { error } = await rpc(worker, "add_rehearsal", {
        p_work_date: workDate,
        p_count: 3,
      });

      expect(error?.message).toBe("wrong_kind");
    });

    it("교육 배정만 있는 날에 시각을 보내면 통과한다", async () => {
      const worker = await createApprovedUser();
      grantRehearsal(worker.profileId, admin.profileId);
      const { workDate, dayId } = await seedDayWithSlot(admin);
      seedAssignment(dayId, worker.profileId, "training", null);

      const { error } = await rpc(worker, "add_rehearsal", {
        p_work_date: workDate,
        p_starts_at: "14:00",
        p_ends_at: "16:00",
      });

      expect(error).toBeNull();
    });
  });

  describe("갈래 안의 값 검사 — bad_hours·bad_count는 겹침·중복보다 먼저다", () => {
    it("끝이 시작보다 이르거나 같으면 bad_hours", async () => {
      const worker = await createApprovedUser();
      grantRehearsal(worker.profileId, admin.profileId);

      const { error } = await rpc(worker, "add_rehearsal", {
        p_work_date: freshWorkDate(),
        p_starts_at: "16:00",
        p_ends_at: "14:00",
      });

      expect(error?.message).toBe("bad_hours");
    });

    it("건수가 1~9 밖이면 bad_count", async () => {
      const worker = await createApprovedUser();
      grantRehearsal(worker.profileId, admin.profileId);
      const { workDate, dayId, slotId } = await seedDayWithSlot(admin);
      seedAssignment(dayId, worker.profileId, "regular", slotId);

      const { error } = await rpc(worker, "add_rehearsal", {
        p_work_date: workDate,
        p_count: 10,
      });

      expect(error?.message).toBe("bad_count");
    });
  });

  describe("시각 갈래 — 겹침은 리허설 행끼리만 본다", () => {
    it("겹치는 구간을 또 넣으면 overlaps", async () => {
      const worker = await createApprovedUser();
      grantRehearsal(worker.profileId, admin.profileId);
      const workDate = freshWorkDate();
      await rpcOrThrow(worker, "add_rehearsal", {
        p_work_date: workDate,
        p_starts_at: "14:00",
        p_ends_at: "16:00",
      });

      const { error } = await rpc(worker, "add_rehearsal", {
        p_work_date: workDate,
        p_starts_at: "15:00",
        p_ends_at: "17:00",
      });

      expect(error?.message).toBe("overlaps");
    });

    it("겹치지 않으면 배정 없는 날에도 여러 건이 선다", async () => {
      const worker = await createApprovedUser();
      grantRehearsal(worker.profileId, admin.profileId);
      const workDate = freshWorkDate();

      await rpcOrThrow(worker, "add_rehearsal", {
        p_work_date: workDate,
        p_starts_at: "09:00",
        p_ends_at: "10:00",
      });
      await rpcOrThrow(worker, "add_rehearsal", {
        p_work_date: workDate,
        p_starts_at: "14:00",
        p_ends_at: "16:00",
      });

      expect(await countRowsFor(admin, worker.profileId, workDate)).toBe(2);
    });

    it("배정된 근무 시간과는 안 견준다 — 근무 시간 밖이라도 리허설끼리만 안 겹치면 통과", async () => {
      const worker = await createApprovedUser();
      grantRehearsal(worker.profileId, admin.profileId);
      const { workDate, dayId, slotId } = await seedDayWithSlot(admin);
      seedAssignment(dayId, worker.profileId, "regular", slotId);

      const { error } = await rpc(worker, "add_rehearsal", {
        p_work_date: workDate,
        p_count: 5,
      });

      expect(error).toBeNull();
    });
  });

  describe("건수 갈래 — 하루 한 줄이다", () => {
    it("이미 건수 행이 있으면 already_exists", async () => {
      const worker = await createApprovedUser();
      grantRehearsal(worker.profileId, admin.profileId);
      const { workDate, dayId, slotId } = await seedDayWithSlot(admin);
      seedAssignment(dayId, worker.profileId, "regular", slotId);
      await rpcOrThrow(worker, "add_rehearsal", {
        p_work_date: workDate,
        p_count: 2,
      });

      const { error } = await rpc(worker, "add_rehearsal", {
        p_work_date: workDate,
        p_count: 3,
      });

      expect(error?.message).toBe("already_exists");
    });
  });

  describe("edit_rehearsal — 남의 행은 관리자도 못 쓰고, 갈래를 다시 정하지 않는다", () => {
    it("남의 행을 고치면 관리자여도 not_allowed", async () => {
      const worker = await createApprovedUser();
      grantRehearsal(worker.profileId, admin.profileId);
      const workDate = freshWorkDate();
      const id = seedTimeRehearsal(
        worker.profileId,
        workDate,
        "14:00",
        "16:00",
      );

      const { error } = await rpc(admin, "edit_rehearsal", {
        p_id: id,
        p_starts_at: "15:00",
        p_ends_at: "17:00",
      });

      expect(error?.message).toBe("not_allowed");
    });

    it("시각 행에 건수를 보내면 wrong_kind — 행의 갈래를 다시 판정하지 않는다", async () => {
      const worker = await createApprovedUser();
      grantRehearsal(worker.profileId, admin.profileId);
      const workDate = freshWorkDate();
      const id = seedTimeRehearsal(
        worker.profileId,
        workDate,
        "14:00",
        "16:00",
      );

      const { error } = await rpc(worker, "edit_rehearsal", {
        p_id: id,
        p_count: 3,
      });

      expect(error?.message).toBe("wrong_kind");
    });

    it("겹침 검사는 자기 자신을 뺀 나머지와 한다", async () => {
      const worker = await createApprovedUser();
      grantRehearsal(worker.profileId, admin.profileId);
      const workDate = freshWorkDate();
      const firstId = seedTimeRehearsal(
        worker.profileId,
        workDate,
        "09:00",
        "10:00",
      );
      seedTimeRehearsal(worker.profileId, workDate, "14:00", "16:00");

      const { error } = await rpc(worker, "edit_rehearsal", {
        p_id: firstId,
        p_starts_at: "09:00",
        p_ends_at: "10:30",
      });

      expect(error).toBeNull();
    });

    it("다른 행과 겹치는 값으로 고치면 overlaps", async () => {
      const worker = await createApprovedUser();
      grantRehearsal(worker.profileId, admin.profileId);
      const workDate = freshWorkDate();
      const firstId = seedTimeRehearsal(
        worker.profileId,
        workDate,
        "09:00",
        "10:00",
      );
      seedTimeRehearsal(worker.profileId, workDate, "14:00", "16:00");

      const { error } = await rpc(worker, "edit_rehearsal", {
        p_id: firstId,
        p_starts_at: "15:00",
        p_ends_at: "16:30",
      });

      expect(error?.message).toBe("overlaps");
    });
  });

  describe("remove_rehearsal — 남의 행은 관리자도 못 지운다", () => {
    it("남의 행을 지우면 관리자여도 not_allowed", async () => {
      const worker = await createApprovedUser();
      grantRehearsal(worker.profileId, admin.profileId);
      const workDate = freshWorkDate();
      const id = seedTimeRehearsal(
        worker.profileId,
        workDate,
        "14:00",
        "16:00",
      );

      const { error } = await rpc(admin, "remove_rehearsal", { p_id: id });

      expect(error?.message).toBe("not_allowed");
    });

    it("본인이 지우면 행이 사라진다", async () => {
      const worker = await createApprovedUser();
      grantRehearsal(worker.profileId, admin.profileId);
      const workDate = freshWorkDate();
      const id = seedTimeRehearsal(
        worker.profileId,
        workDate,
        "14:00",
        "16:00",
      );

      await rpcOrThrow(worker, "remove_rehearsal", { p_id: id });

      const { data } = await admin.client
        .from("rehearsals")
        .select("id")
        .eq("id", id);
      expect(data).toEqual([]);
    });
  });

  describe("자격 회수 — 이미 선 행은 안 지우지만 회수 뒤 함수는 여전히 첫 줄에서 막는다", () => {
    it("자격을 거두어도 이미 넣은 행은 그대로 남는다", async () => {
      const worker = await createApprovedUser();
      grantRehearsal(worker.profileId, admin.profileId);
      const workDate = freshWorkDate();
      const id = seedTimeRehearsal(
        worker.profileId,
        workDate,
        "14:00",
        "16:00",
      );

      revokeRehearsal(worker.profileId);

      const { data } = await admin.client
        .from("rehearsals")
        .select("id")
        .eq("id", id);
      expect(data).toEqual([{ id }]);
    });

    it("자격을 거둔 뒤에는 그 사람의 edit_rehearsal도 not_qualified로 막힌다", async () => {
      const worker = await createApprovedUser();
      grantRehearsal(worker.profileId, admin.profileId);
      const workDate = freshWorkDate();
      const id = seedTimeRehearsal(
        worker.profileId,
        workDate,
        "14:00",
        "16:00",
      );
      revokeRehearsal(worker.profileId);

      const { error } = await rpc(worker, "edit_rehearsal", {
        p_id: id,
        p_starts_at: "15:00",
        p_ends_at: "17:00",
      });

      expect(error?.message).toBe("not_qualified");
    });
  });
});
