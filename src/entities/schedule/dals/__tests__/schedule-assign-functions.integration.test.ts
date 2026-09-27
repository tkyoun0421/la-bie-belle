import { randomUUID } from "node:crypto";
import {
  backdateDeadline,
  createAdminUser,
  createApprovedUser,
  execSql,
  kstDate,
  kstMonthStart,
  seedAssignment,
  seedWorkRequest,
  withFreshMonth,
  type AdminUser,
  type ApprovedUser,
} from "@tests/integration/postgres";

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
): Promise<unknown> {
  const { data, error } = await rpc(user, fn, args);
  if (error) {
    throw new Error(error.message);
  }
  return data;
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

type SlotRow = {
  id: string;
  positions: string[];
  ended_at: string | null;
  created_at: string;
};

async function slotsForDay(
  admin: AdminUser,
  dayId: string,
): Promise<SlotRow[]> {
  const { data, error } = await admin.client
    .from("slots")
    .select("id, positions, ended_at, created_at")
    .eq("day_id", dayId);
  if (error) {
    throw error;
  }
  return (data ?? []) as SlotRow[];
}

async function slotIdForPosition(
  admin: AdminUser,
  dayId: string,
  position: string,
  index = 0,
): Promise<string> {
  const slots = await slotsForDay(admin, dayId);
  const matches = slots.filter(
    (slot) => slot.positions.length === 1 && slot.positions[0] === position,
  );
  const slot = matches[index];
  if (!slot) {
    throw new Error(`${position} 자리를 못 찾았다`);
  }
  return slot.id;
}

async function seedOpenDay(admin: AdminUser): Promise<{
  month: string;
  scheduleId: string;
  dayId: string;
  workDate: string;
}> {
  return withFreshMonth(async (monthsFromNow) => {
    const workDate = kstMonthStart(monthsFromNow);
    await rpcOrThrow(admin, "create_schedule", {
      p_month: workDate,
      p_deadline: kstDate(1),
    });
    await rpcOrThrow(admin, "open_day", { p_work_date: workDate });
    return {
      month: workDate,
      scheduleId: await scheduleIdFor(admin, workDate),
      dayId: await dayIdFor(admin, workDate),
      workDate,
    };
  });
}

function nextCalendarDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

async function seedConfirmedMonthWithNewDay(admin: AdminUser): Promise<{
  month: string;
  scheduleId: string;
  confirmedDayId: string;
  confirmedWorkDate: string;
  newDayId: string;
  newWorkDate: string;
}> {
  const { month, scheduleId, dayId, workDate } = await seedOpenDay(admin);
  backdateDeadline(scheduleId, kstDate(-1));
  await rpcOrThrow(admin, "confirm_schedule", { p_month: month });

  const newWorkDate = nextCalendarDate(workDate);
  await rpcOrThrow(admin, "open_day", { p_work_date: newWorkDate });

  return {
    month,
    scheduleId,
    confirmedDayId: dayId,
    confirmedWorkDate: workDate,
    newDayId: await dayIdFor(admin, newWorkDate),
    newWorkDate,
  };
}

async function applyForDay(
  user: ApprovedUser,
  workDate: string,
): Promise<void> {
  const month = `${workDate.slice(0, 7)}-01`;
  await rpcOrThrow(user, "submit_availability", {
    p_month: month,
    p_dates: [workDate],
  });
}

function positionsLiteral(positions: string[]): string {
  return `{${positions.map((position) => `"${position}"`).join(",")}}`;
}

function insertSlotRow(
  dayId: string,
  positions: string[],
  endedAt: string | null = null,
): string {
  const id = randomUUID();
  const endedSql = endedAt === null ? "null" : `'${endedAt}'`;
  execSql(
    `insert into public.slots (id, day_id, positions, ended_at) values (:'id', :'day_id', '${positionsLiteral(positions)}', ${endedSql});\n`,
    { id, day_id: dayId },
  );
  return id;
}

function setSlotCreatedAt(slotId: string, createdAt: string): void {
  execSql(
    "update public.slots set created_at = :'created_at' where id = :'id';\n",
    { id: slotId, created_at: createdAt },
  );
}

describe("근무표 배정 함수", () => {
  let admin: AdminUser;
  let worker: ApprovedUser;

  beforeAll(async () => {
    admin = await createAdminUser();
    worker = await createApprovedUser();
  });

  describe("호출자 검사 — 근무자가 부르면 not_allowed", () => {
    it("add_slot을 근무자가 부르면 not_allowed", async () => {
      const { error } = await rpc(worker, "add_slot", {
        p_day_id: randomUUID(),
        p_position: "안내",
      });
      expect(error?.message).toBe("not_allowed");
    });

    it("remove_slot을 근무자가 부르면 not_allowed", async () => {
      const { error } = await rpc(worker, "remove_slot", {
        p_slot_id: randomUUID(),
      });
      expect(error?.message).toBe("not_allowed");
    });

    it("merge_slots를 근무자가 부르면 not_allowed", async () => {
      const { error } = await rpc(worker, "merge_slots", {
        p_day_id: randomUUID(),
        p_from: "안내",
        p_to: "매니저",
      });
      expect(error?.message).toBe("not_allowed");
    });

    it("split_slot을 근무자가 부르면 not_allowed", async () => {
      const { error } = await rpc(worker, "split_slot", {
        p_slot_id: randomUUID(),
      });
      expect(error?.message).toBe("not_allowed");
    });

    it("add_assignment를 근무자가 부르면 not_allowed", async () => {
      const { error } = await rpc(worker, "add_assignment", {
        p_profile_id: randomUUID(),
        p_kind: "regular",
        p_slot_id: randomUUID(),
      });
      expect(error?.message).toBe("not_allowed");
    });

    it("remove_assignment를 근무자가 부르면 not_allowed", async () => {
      const { error } = await rpc(worker, "remove_assignment", {
        p_assignment_id: randomUUID(),
      });
      expect(error?.message).toBe("not_allowed");
    });

    it("force_change를 근무자가 부르면 not_allowed", async () => {
      const { error } = await rpc(worker, "force_change", {
        p_assignment_id: randomUUID(),
        p_profile_id: randomUUID(),
      });
      expect(error?.message).toBe("not_allowed");
    });

    it("grant_position을 근무자가 부르면 not_allowed", async () => {
      const { error } = await rpc(worker, "grant_position", {
        p_profile_id: randomUUID(),
        p_position: "스캔",
      });
      expect(error?.message).toBe("not_allowed");
    });
  });

  describe("add_slot", () => {
    it("상한 없이 여러 번 더한다", async () => {
      const { dayId } = await seedOpenDay(admin);

      await rpcOrThrow(admin, "add_slot", {
        p_day_id: dayId,
        p_position: "매니저",
      });
      await rpcOrThrow(admin, "add_slot", {
        p_day_id: dayId,
        p_position: "매니저",
      });
      await rpcOrThrow(admin, "add_slot", {
        p_day_id: dayId,
        p_position: "매니저",
      });

      const slots = await slotsForDay(admin, dayId);
      const live매니저 = slots.filter(
        (slot) =>
          slot.ended_at === null &&
          slot.positions.length === 1 &&
          slot.positions[0] === "매니저",
      );
      expect(live매니저).toHaveLength(5);
    });

    it("확정 시점 날에 더하면 already_confirmed", async () => {
      const { confirmedDayId } = await seedConfirmedMonthWithNewDay(admin);

      const { error } = await rpc(admin, "add_slot", {
        p_day_id: confirmedDayId,
        p_position: "매니저",
      });
      expect(error?.message).toBe("already_confirmed");
    });

    it("확정 뒤 새로 연 날은 통과한다", async () => {
      const { newDayId } = await seedConfirmedMonthWithNewDay(admin);

      const { error } = await rpc(admin, "add_slot", {
        p_day_id: newDayId,
        p_position: "매니저",
      });
      expect(error).toBeNull();

      const slots = await slotsForDay(admin, newDayId);
      const added = slots.filter(
        (slot) =>
          slot.ended_at === null &&
          slot.positions.length === 1 &&
          slot.positions[0] === "매니저",
      );
      expect(added).toHaveLength(3);
    });
  });

  describe("remove_slot", () => {
    it("확정 전이면 자리를 지운다", async () => {
      const { dayId } = await seedOpenDay(admin);
      const slotId = await slotIdForPosition(admin, dayId, "축가");

      const { error } = await rpc(admin, "remove_slot", { p_slot_id: slotId });
      expect(error).toBeNull();

      const { data } = await admin.client
        .from("slots")
        .select("id")
        .eq("id", slotId);
      expect(data).toEqual([]);
    });

    it("확정 시점 날의 자리를 지우면 already_confirmed", async () => {
      const { confirmedDayId } = await seedConfirmedMonthWithNewDay(admin);
      const slotId = await slotIdForPosition(admin, confirmedDayId, "축가");

      const { error } = await rpc(admin, "remove_slot", { p_slot_id: slotId });
      expect(error?.message).toBe("already_confirmed");
    });

    it("확정 뒤 새로 연 날은 ended_at을 찍는다", async () => {
      const { newDayId } = await seedConfirmedMonthWithNewDay(admin);
      const slotId = await slotIdForPosition(admin, newDayId, "축가");

      const { error } = await rpc(admin, "remove_slot", { p_slot_id: slotId });
      expect(error).toBeNull();

      const { data } = await admin.client
        .from("slots")
        .select("ended_at")
        .eq("id", slotId)
        .single<{ ended_at: string | null }>();
      expect(data?.ended_at).not.toBeNull();
    });

    it("살아 있는 정규 배정이 있으면 같이 닫는다", async () => {
      const { dayId, workDate } = await seedOpenDay(admin);
      const occupant = await createApprovedUser();
      await applyForDay(occupant, workDate);
      const slotId = await slotIdForPosition(admin, dayId, "축가");
      const assignmentId = seedAssignment(
        dayId,
        occupant.profileId,
        "regular",
        slotId,
      );

      await rpcOrThrow(admin, "remove_slot", { p_slot_id: slotId });

      const { data } = await admin.client
        .from("assignments")
        .select("id")
        .eq("id", assignmentId);
      expect(data).toEqual([]);
    });
  });

  describe("merge_slots", () => {
    it("받는 쪽 positions가 늘고 내주는 쪽은 닫힌다", async () => {
      const { dayId } = await seedOpenDay(admin);

      const { error } = await rpc(admin, "merge_slots", {
        p_day_id: dayId,
        p_from: "매니저",
        p_to: "축가",
      });
      expect(error).toBeNull();

      const slots = await slotsForDay(admin, dayId);
      const live매니저 = slots.filter(
        (slot) =>
          slot.ended_at === null &&
          slot.positions.length === 1 &&
          slot.positions[0] === "매니저",
      );
      expect(live매니저).toHaveLength(1);

      const merged = slots.find(
        (slot) => slot.ended_at === null && slot.positions.length === 2,
      );
      expect(merged?.positions).toEqual(["축가", "매니저"]);
    });

    it("사람이 든 자리는 건드리지 않고 빈 자리만 고른다", async () => {
      const { dayId, workDate } = await seedOpenDay(admin);
      const occupant = await createApprovedUser();
      await applyForDay(occupant, workDate);
      const slots = await slotsForDay(admin, dayId);
      const 매니저Slots = slots.filter(
        (slot) => slot.positions.length === 1 && slot.positions[0] === "매니저",
      );
      const filledSlotId = 매니저Slots[0]!.id;
      const emptySlotId = 매니저Slots[1]!.id;
      seedAssignment(dayId, occupant.profileId, "regular", filledSlotId);

      await rpcOrThrow(admin, "merge_slots", {
        p_day_id: dayId,
        p_from: "매니저",
        p_to: "축가",
      });

      const { data: filled } = await admin.client
        .from("slots")
        .select("ended_at, positions")
        .eq("id", filledSlotId)
        .single<{ ended_at: string | null; positions: string[] }>();
      expect(filled?.ended_at).toBeNull();
      expect(filled?.positions).toEqual(["매니저"]);

      const { data: empty } = await admin.client
        .from("slots")
        .select("ended_at")
        .eq("id", emptySlotId)
        .single<{ ended_at: string | null }>();
      expect(empty?.ended_at).not.toBeNull();
    });

    it("빈 자리가 여럿이면 먼저 만든 것을 고른다", async () => {
      const { dayId } = await seedOpenDay(admin);
      const slots = await slotsForDay(admin, dayId);
      const 매니저Slots = slots.filter(
        (slot) => slot.positions.length === 1 && slot.positions[0] === "매니저",
      );
      const earlierSlotId = 매니저Slots[0]!.id;
      const laterSlotId = 매니저Slots[1]!.id;
      setSlotCreatedAt(
        earlierSlotId,
        new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      );
      setSlotCreatedAt(
        laterSlotId,
        new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      );

      await rpcOrThrow(admin, "merge_slots", {
        p_day_id: dayId,
        p_from: "매니저",
        p_to: "축가",
      });

      const { data: earlier } = await admin.client
        .from("slots")
        .select("ended_at")
        .eq("id", earlierSlotId)
        .single<{ ended_at: string | null }>();
      expect(earlier?.ended_at).not.toBeNull();

      const { data: later } = await admin.client
        .from("slots")
        .select("ended_at")
        .eq("id", laterSlotId)
        .single<{ ended_at: string | null }>();
      expect(later?.ended_at).toBeNull();
    });

    it("양쪽 다 찼으면 no_empty_slot", async () => {
      const { dayId, workDate } = await seedOpenDay(admin);
      const first = await createApprovedUser();
      const second = await createApprovedUser();
      const third = await createApprovedUser();
      await applyForDay(first, workDate);
      await applyForDay(second, workDate);
      await applyForDay(third, workDate);

      const slots = await slotsForDay(admin, dayId);
      const 매니저Slots = slots.filter(
        (slot) => slot.positions.length === 1 && slot.positions[0] === "매니저",
      );
      const 축가Slot = slots.find(
        (slot) => slot.positions.length === 1 && slot.positions[0] === "축가",
      )!;
      seedAssignment(dayId, first.profileId, "regular", 매니저Slots[0]!.id);
      seedAssignment(dayId, second.profileId, "regular", 매니저Slots[1]!.id);
      seedAssignment(dayId, third.profileId, "regular", 축가Slot.id);

      const { error } = await rpc(admin, "merge_slots", {
        p_day_id: dayId,
        p_from: "매니저",
        p_to: "축가",
      });
      expect(error?.message).toBe("no_empty_slot");
    });

    it("내주는 자리에 걸린 살아 있는 요청도 같이 닫는다", async () => {
      const { dayId } = await seedOpenDay(admin);
      const slots = await slotsForDay(admin, dayId);
      const 매니저Slots = slots.filter(
        (slot) => slot.positions.length === 1 && slot.positions[0] === "매니저",
      );
      const requestId = seedWorkRequest(매니저Slots[0]!.id, admin.profileId);

      await rpcOrThrow(admin, "merge_slots", {
        p_day_id: dayId,
        p_from: "매니저",
        p_to: "축가",
      });

      const { data } = await admin.client
        .from("requests")
        .select("closed_at")
        .eq("id", requestId)
        .single<{ closed_at: string | null }>();
      expect(data?.closed_at).not.toBeNull();
    });
  });

  describe("split_slot", () => {
    it("포지션이 하나뿐이면 not_merged", async () => {
      const { dayId } = await seedOpenDay(admin);
      const slotId = await slotIdForPosition(admin, dayId, "축가");

      const { error } = await rpc(admin, "split_slot", { p_slot_id: slotId });
      expect(error?.message).toBe("not_merged");
    });

    it("합친 자리를 나누면 두 포지션으로 돌아가고 배정자는 받은 쪽에 남는다", async () => {
      const { dayId, workDate } = await seedOpenDay(admin);
      const worker2 = await createApprovedUser();
      await applyForDay(worker2, workDate);

      const original축가 = await slotIdForPosition(admin, dayId, "축가");
      const original매니저 = (await slotsForDay(admin, dayId)).filter(
        (slot) => slot.positions.length === 1 && slot.positions[0] === "매니저",
      )[0]!.id;
      execSql("update public.slots set ended_at = now() where id = :'id';\n", {
        id: original축가,
      });
      execSql("update public.slots set ended_at = now() where id = :'id';\n", {
        id: original매니저,
      });

      const mergedSlotId = insertSlotRow(dayId, ["축가", "매니저"]);
      const assignmentId = seedAssignment(
        dayId,
        worker2.profileId,
        "regular",
        mergedSlotId,
      );
      execSql(
        "update public.assignments set position = '축가' where id = :'id';\n",
        { id: assignmentId },
      );

      const { error } = await rpc(admin, "split_slot", {
        p_slot_id: mergedSlotId,
      });
      expect(error).toBeNull();

      const slots = await slotsForDay(admin, dayId);
      const live축가 = slots.filter(
        (slot) =>
          slot.ended_at === null &&
          slot.positions.length === 1 &&
          slot.positions[0] === "축가",
      );
      const live매니저 = slots.filter(
        (slot) =>
          slot.ended_at === null &&
          slot.positions.length === 1 &&
          slot.positions[0] === "매니저",
      );
      expect(live축가.length).toBeGreaterThanOrEqual(1);
      expect(live매니저.length).toBeGreaterThanOrEqual(1);

      const stillMerged = slots.some(
        (slot) => slot.ended_at === null && slot.positions.length === 2,
      );
      expect(stillMerged).toBe(false);

      const { data: liveAssignment } = await admin.client
        .from("assignments")
        .select("slot_id, position")
        .eq("profile_id", worker2.profileId)
        .eq("day_id", dayId)
        .is("ended_at", null)
        .single<{ slot_id: string | null; position: string }>();
      expect(liveAssignment?.position).toBe("축가");
      expect(live축가.map((slot) => slot.id)).toContain(
        liveAssignment?.slot_id,
      );
    });
  });

  describe("add_assignment", () => {
    it("신청 안 한 사람에게 정규 배정하면 not_applied", async () => {
      const { dayId } = await seedOpenDay(admin);
      const applicant = await createApprovedUser();
      const slotId = await slotIdForPosition(admin, dayId, "안내");

      const { error } = await rpc(admin, "add_assignment", {
        p_profile_id: applicant.profileId,
        p_kind: "regular",
        p_slot_id: slotId,
      });
      expect(error?.message).toBe("not_applied");
    });

    it("신청은 했지만 제한 포지션 자격이 없으면 not_qualified", async () => {
      const { dayId, workDate } = await seedOpenDay(admin);
      const applicant = await createApprovedUser();
      await applyForDay(applicant, workDate);
      const slotId = await slotIdForPosition(admin, dayId, "스캔");

      const { error } = await rpc(admin, "add_assignment", {
        p_profile_id: applicant.profileId,
        p_kind: "regular",
        p_slot_id: slotId,
      });
      expect(error?.message).toBe("not_qualified");
    });

    it("그날 이미 다른 자리에 정규로 든 사람이면 already_assigned", async () => {
      const { dayId, workDate } = await seedOpenDay(admin);
      const applicant = await createApprovedUser();
      await applyForDay(applicant, workDate);
      const firstSlotId = await slotIdForPosition(admin, dayId, "안내", 0);
      seedAssignment(dayId, applicant.profileId, "regular", firstSlotId);
      const secondSlotId = await slotIdForPosition(admin, dayId, "안내", 1);

      const { error } = await rpc(admin, "add_assignment", {
        p_profile_id: applicant.profileId,
        p_kind: "regular",
        p_slot_id: secondSlotId,
      });
      expect(error?.message).toBe("already_assigned");
    });

    it("자리가 이미 찼으면 slot_full", async () => {
      const { dayId, workDate } = await seedOpenDay(admin);
      const occupant = await createApprovedUser();
      await applyForDay(occupant, workDate);
      const slotId = await slotIdForPosition(admin, dayId, "대기실");
      seedAssignment(dayId, occupant.profileId, "regular", slotId);

      const applicant = await createApprovedUser();
      await applyForDay(applicant, workDate);

      const { error } = await rpc(admin, "add_assignment", {
        p_profile_id: applicant.profileId,
        p_kind: "regular",
        p_slot_id: slotId,
      });
      expect(error?.message).toBe("slot_full");
    });

    it("미신청과 자격 없음이 겹치면 not_applied가 먼저다", async () => {
      const { dayId } = await seedOpenDay(admin);
      const applicant = await createApprovedUser();
      const slotId = await slotIdForPosition(admin, dayId, "드레스");

      const { error } = await rpc(admin, "add_assignment", {
        p_profile_id: applicant.profileId,
        p_kind: "regular",
        p_slot_id: slotId,
      });
      expect(error?.message).toBe("not_applied");
    });

    it("정규인데 slot_id가 없으면 wrong_kind", async () => {
      const { dayId } = await seedOpenDay(admin);
      const applicant = await createApprovedUser();

      const { error } = await rpc(admin, "add_assignment", {
        p_profile_id: applicant.profileId,
        p_kind: "regular",
        p_day_id: dayId,
        p_position: "안내",
      });
      expect(error?.message).toBe("wrong_kind");
    });

    it("교육인데 slot_id가 있으면 wrong_kind", async () => {
      const { dayId } = await seedOpenDay(admin);
      const applicant = await createApprovedUser();
      const slotId = await slotIdForPosition(admin, dayId, "안내");

      const { error } = await rpc(admin, "add_assignment", {
        p_profile_id: applicant.profileId,
        p_kind: "training",
        p_slot_id: slotId,
        p_position: "안내",
      });
      expect(error?.message).toBe("wrong_kind");
    });

    it("p_skip_qualification이면 자격 검사만 건너뛴다", async () => {
      const { dayId, workDate } = await seedOpenDay(admin);
      const applicant = await createApprovedUser();
      await applyForDay(applicant, workDate);
      const slotId = await slotIdForPosition(admin, dayId, "메인");

      const { error } = await rpc(admin, "add_assignment", {
        p_profile_id: applicant.profileId,
        p_kind: "regular",
        p_slot_id: slotId,
        p_skip_qualification: true,
      });
      expect(error).toBeNull();

      const { data } = await admin.client
        .from("assignments")
        .select("profile_id")
        .eq("slot_id", slotId)
        .is("ended_at", null)
        .single<{ profile_id: string }>();
      expect(data?.profile_id).toBe(applicant.profileId);
    });

    it("교육 배정은 제한 포지션이어도 자격 검사를 건너뛴다", async () => {
      const { dayId, workDate } = await seedOpenDay(admin);
      const applicant = await createApprovedUser();
      await applyForDay(applicant, workDate);

      const { error } = await rpc(admin, "add_assignment", {
        p_profile_id: applicant.profileId,
        p_kind: "training",
        p_day_id: dayId,
        p_position: "팀장",
      });
      expect(error).toBeNull();

      const { data } = await admin.client
        .from("assignments")
        .select("kind, slot_id")
        .eq("day_id", dayId)
        .eq("profile_id", applicant.profileId)
        .is("ended_at", null)
        .single<{ kind: string; slot_id: string | null }>();
      expect(data?.kind).toBe("training");
      expect(data?.slot_id).toBeNull();
    });

    it("그날 이미 정규로 든 사람에게 교육을 붙이면 already_assigned", async () => {
      const { dayId, workDate } = await seedOpenDay(admin);
      const applicant = await createApprovedUser();
      await applyForDay(applicant, workDate);
      const slotId = await slotIdForPosition(admin, dayId, "안내");
      seedAssignment(dayId, applicant.profileId, "regular", slotId);

      const { error } = await rpc(admin, "add_assignment", {
        p_profile_id: applicant.profileId,
        p_kind: "training",
        p_day_id: dayId,
        p_position: "메인",
      });
      expect(error?.message).toBe("already_assigned");
    });

    it("교육 배정은 자리를 먹지 않아 같은 포지션 정규 배정에 영향이 없다", async () => {
      const { dayId, workDate } = await seedOpenDay(admin);
      const trainee = await createApprovedUser();
      await applyForDay(trainee, workDate);
      await rpcOrThrow(admin, "add_assignment", {
        p_profile_id: trainee.profileId,
        p_kind: "training",
        p_day_id: dayId,
        p_position: "안내",
      });

      const applicant = await createApprovedUser();
      await applyForDay(applicant, workDate);
      const slotId = await slotIdForPosition(admin, dayId, "안내", 0);

      const { error } = await rpc(admin, "add_assignment", {
        p_profile_id: applicant.profileId,
        p_kind: "regular",
        p_slot_id: slotId,
      });
      expect(error).toBeNull();
    });
  });

  describe("remove_assignment", () => {
    it("확정 전이면 행을 지운다", async () => {
      const { dayId, workDate } = await seedOpenDay(admin);
      const occupant = await createApprovedUser();
      await applyForDay(occupant, workDate);
      const slotId = await slotIdForPosition(admin, dayId, "안내");
      const assignmentId = seedAssignment(
        dayId,
        occupant.profileId,
        "regular",
        slotId,
      );

      const { error } = await rpc(admin, "remove_assignment", {
        p_assignment_id: assignmentId,
      });
      expect(error).toBeNull();

      const { data } = await admin.client
        .from("assignments")
        .select("id")
        .eq("id", assignmentId);
      expect(data).toEqual([]);
    });

    it("확정 뒤에는 ended_at·ended_reason·ended_by를 찍는다", async () => {
      const { dayId, scheduleId, workDate } = await seedOpenDay(admin);
      const occupant = await createApprovedUser();
      await applyForDay(occupant, workDate);
      const slotId = await slotIdForPosition(admin, dayId, "안내");
      const assignmentId = seedAssignment(
        dayId,
        occupant.profileId,
        "regular",
        slotId,
      );

      backdateDeadline(scheduleId, kstDate(-1));
      await rpcOrThrow(admin, "confirm_schedule", { p_month: workDate });

      const { error } = await rpc(admin, "remove_assignment", {
        p_assignment_id: assignmentId,
      });
      expect(error).toBeNull();

      const { data } = await admin.client
        .from("assignments")
        .select("ended_at, ended_reason, ended_by")
        .eq("id", assignmentId)
        .single<{
          ended_at: string | null;
          ended_reason: string | null;
          ended_by: string | null;
        }>();
      expect(data?.ended_at).not.toBeNull();
      expect(data?.ended_reason).not.toBeNull();
      expect(data?.ended_by).toBe(admin.profileId);
    });

    it("이미 닫힌 배정을 다시 지우면 stale", async () => {
      const { dayId, workDate } = await seedOpenDay(admin);
      const occupant = await createApprovedUser();
      await applyForDay(occupant, workDate);
      const slotId = await slotIdForPosition(admin, dayId, "안내");
      const assignmentId = seedAssignment(
        dayId,
        occupant.profileId,
        "regular",
        slotId,
      );

      await rpcOrThrow(admin, "remove_assignment", {
        p_assignment_id: assignmentId,
      });

      const { error } = await rpc(admin, "remove_assignment", {
        p_assignment_id: assignmentId,
      });
      expect(error?.message).toBe("stale");
    });
  });

  describe("force_change", () => {
    it("확정 뒤 사람을 바꾸면 옛 배정은 닫히고 새 배정이 선다", async () => {
      const { dayId, scheduleId, workDate } = await seedOpenDay(admin);
      const oldWorker = await createApprovedUser();
      await applyForDay(oldWorker, workDate);
      const slotId = await slotIdForPosition(admin, dayId, "안내");
      const oldAssignmentId = seedAssignment(
        dayId,
        oldWorker.profileId,
        "regular",
        slotId,
      );

      const newWorker = await createApprovedUser();
      await applyForDay(newWorker, workDate);

      backdateDeadline(scheduleId, kstDate(-1));
      await rpcOrThrow(admin, "confirm_schedule", { p_month: workDate });

      const { data, error } = await rpc(admin, "force_change", {
        p_assignment_id: oldAssignmentId,
        p_profile_id: newWorker.profileId,
      });
      expect(error).toBeNull();
      const newAssignmentId = data as string;
      expect(newAssignmentId).not.toBe(oldAssignmentId);

      const { data: oldRow } = await admin.client
        .from("assignments")
        .select("ended_at")
        .eq("id", oldAssignmentId)
        .single<{ ended_at: string | null }>();
      expect(oldRow?.ended_at).not.toBeNull();

      const { data: newRow } = await admin.client
        .from("assignments")
        .select("profile_id, slot_id, ended_at")
        .eq("id", newAssignmentId)
        .single<{
          profile_id: string;
          slot_id: string | null;
          ended_at: string | null;
        }>();
      expect(newRow?.profile_id).toBe(newWorker.profileId);
      expect(newRow?.slot_id).toBe(slotId);
      expect(newRow?.ended_at).toBeNull();
    });

    it("새 사람이 검사에 걸리면 원자적으로 기존 배정이 그대로 남는다", async () => {
      const { dayId, scheduleId, workDate } = await seedOpenDay(admin);
      const oldWorker = await createApprovedUser();
      await applyForDay(oldWorker, workDate);
      const slotId = await slotIdForPosition(admin, dayId, "안내");
      const oldAssignmentId = seedAssignment(
        dayId,
        oldWorker.profileId,
        "regular",
        slotId,
      );

      backdateDeadline(scheduleId, kstDate(-1));
      await rpcOrThrow(admin, "confirm_schedule", { p_month: workDate });

      const unappliedWorker = await createApprovedUser();

      const { error } = await rpc(admin, "force_change", {
        p_assignment_id: oldAssignmentId,
        p_profile_id: unappliedWorker.profileId,
      });
      expect(error?.message).toBe("not_applied");

      const { data: oldRow } = await admin.client
        .from("assignments")
        .select("profile_id, ended_at")
        .eq("id", oldAssignmentId)
        .single<{ profile_id: string; ended_at: string | null }>();
      expect(oldRow?.profile_id).toBe(oldWorker.profileId);
      expect(oldRow?.ended_at).toBeNull();
    });
  });

  describe("grant_position", () => {
    it("이미 자격이 있어도 다시 주면 조용히 통과한다", async () => {
      const grantee = await createApprovedUser();

      await rpcOrThrow(admin, "grant_position", {
        p_profile_id: grantee.profileId,
        p_position: "스캔",
      });
      const { error } = await rpc(admin, "grant_position", {
        p_profile_id: grantee.profileId,
        p_position: "스캔",
      });
      expect(error).toBeNull();

      const { data } = await admin.client
        .from("position_grants")
        .select("id")
        .eq("profile_id", grantee.profileId)
        .eq("position", "스캔");
      expect(data).toHaveLength(1);
    });
  });
});
