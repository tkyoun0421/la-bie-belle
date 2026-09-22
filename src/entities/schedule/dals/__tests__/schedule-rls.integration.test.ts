import { randomUUID } from "node:crypto";
import {
  createAdminUser,
  createApprovedUser,
  createLeftUser,
  execSql,
  kstDate,
  kstMonthStart,
  withFreshMonth,
  type AdminUser,
  type ApprovedUser,
  type LeftUser,
} from "@tests/integration/postgres";
import {
  createSignedInUser,
  type SignedInUser,
} from "@tests/integration/supabase";

function randomOffset(): number {
  return 24 + Math.floor(Math.random() * 100000);
}

async function rpcOrThrow(
  user: { client: SignedInUser["client"] },
  fn: string,
  args: Record<string, unknown>,
): Promise<void> {
  const { error } = await user.client.rpc(fn, args);
  if (error) {
    throw error;
  }
}

async function seedOpenDay(admin: AdminUser): Promise<{
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

function seedTrainingAssignment(dayId: string, profileId: string): string {
  const id = randomUUID();
  execSql(
    "insert into public.assignments (id, day_id, slot_id, position, profile_id, kind) values (:'id', :'day_id', null, '안내', :'profile_id', 'training');\n",
    { id, day_id: dayId, profile_id: profileId },
  );
  return id;
}

function seedAvailability(profileId: string, workDate: string): string {
  const id = randomUUID();
  execSql(
    "insert into public.availabilities (id, profile_id, work_date) values (:'id', :'profile_id', :'work_date');\n",
    { id, profile_id: profileId, work_date: workDate },
  );
  return id;
}

function seedCancelRequest(assignmentId: string, profileId: string): string {
  const id = randomUUID();
  execSql(
    "insert into public.cancel_requests (id, assignment_id, profile_id, reason) values (:'id', :'assignment_id', :'profile_id', '개인 사정');\n",
    { id, assignment_id: assignmentId, profile_id: profileId },
  );
  return id;
}

describe("근무표 RLS", () => {
  let admin: AdminUser;
  let owner: ApprovedUser;
  let reader: ApprovedUser;
  let unapproved: SignedInUser;
  let leftUser: LeftUser;

  let schedule: { scheduleId: string; dayId: string; slotIds: string[] };
  let trainingAssignmentId: string;

  beforeAll(async () => {
    admin = await createAdminUser();
    owner = await createApprovedUser();
    reader = await createApprovedUser();
    unapproved = await createSignedInUser();
    leftUser = await createLeftUser();

    schedule = await seedOpenDay(admin);
    trainingAssignmentId = seedTrainingAssignment(
      schedule.dayId,
      owner.profileId,
    );
  });

  describe("승인된 사람 전원 읽기가 기본이다", () => {
    it("승인된 근무자가 schedules를 읽는다", async () => {
      const { data, error } = await reader.client
        .from("schedules")
        .select("id")
        .eq("id", schedule.scheduleId);

      expect(error).toBeNull();
      expect(data).toEqual([{ id: schedule.scheduleId }]);
    });

    it("승인된 근무자가 days를 읽는다", async () => {
      const { data, error } = await reader.client
        .from("days")
        .select("id")
        .eq("id", schedule.dayId);

      expect(error).toBeNull();
      expect(data).toEqual([{ id: schedule.dayId }]);
    });

    it("승인된 근무자가 slots를 읽는다", async () => {
      const { data, error } = await reader.client
        .from("slots")
        .select("id")
        .eq("id", schedule.slotIds[0]!);

      expect(error).toBeNull();
      expect(data).toEqual([{ id: schedule.slotIds[0] }]);
    });

    it("승인된 근무자가 남의 assignments를 읽는다", async () => {
      const { data, error } = await reader.client
        .from("assignments")
        .select("id")
        .eq("id", trainingAssignmentId);

      expect(error).toBeNull();
      expect(data).toEqual([{ id: trainingAssignmentId }]);
    });

    it("승인 전에는 schedules를 한 행도 못 읽는다", async () => {
      const { data, error } = await unapproved.client
        .from("schedules")
        .select("id")
        .eq("id", schedule.scheduleId);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("퇴사자는 schedules를 한 행도 못 읽는다", async () => {
      const { data, error } = await leftUser.client
        .from("schedules")
        .select("id")
        .eq("id", schedule.scheduleId);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });

  describe("근무 신청과 근무 취소는 본인과 관리자만 본다", () => {
    let availabilityId: string;
    let cancelRequestId: string;

    beforeAll(() => {
      const workDate = kstMonthStart(randomOffset());
      availabilityId = seedAvailability(owner.profileId, workDate);
      cancelRequestId = seedCancelRequest(
        trainingAssignmentId,
        owner.profileId,
      );
    });

    it("본인은 자기 근무 신청을 읽는다", async () => {
      const { data, error } = await owner.client
        .from("availabilities")
        .select("id")
        .eq("id", availabilityId);

      expect(error).toBeNull();
      expect(data).toEqual([{ id: availabilityId }]);
    });

    it("남의 근무 신청은 못 읽는다", async () => {
      const { data, error } = await reader.client
        .from("availabilities")
        .select("id")
        .eq("id", availabilityId);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("관리자는 남의 근무 신청을 읽는다", async () => {
      const { data, error } = await admin.client
        .from("availabilities")
        .select("id")
        .eq("id", availabilityId);

      expect(error).toBeNull();
      expect(data).toEqual([{ id: availabilityId }]);
    });

    it("본인은 자기 근무 취소 요청을 읽는다", async () => {
      const { data, error } = await owner.client
        .from("cancel_requests")
        .select("id")
        .eq("id", cancelRequestId);

      expect(error).toBeNull();
      expect(data).toEqual([{ id: cancelRequestId }]);
    });

    it("남의 근무 취소 요청은 못 읽는다", async () => {
      const { data, error } = await reader.client
        .from("cancel_requests")
        .select("id")
        .eq("id", cancelRequestId);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("관리자는 남의 근무 취소 요청을 읽는다", async () => {
      const { data, error } = await admin.client
        .from("cancel_requests")
        .select("id")
        .eq("id", cancelRequestId);

      expect(error).toBeNull();
      expect(data).toEqual([{ id: cancelRequestId }]);
    });
  });

  describe("표 아홉에 직접 못 쓴다", () => {
    it("schedules에 근무자가 직접 insert를 못 한다", async () => {
      const { error } = await reader.client.from("schedules").insert({
        month: kstMonthStart(randomOffset()),
      });
      expect(error?.code).toBe("42501");
    });

    it("schedules에 관리자도 직접 insert를 못 한다", async () => {
      const { error } = await admin.client.from("schedules").insert({
        month: kstMonthStart(randomOffset()),
      });
      expect(error?.code).toBe("42501");
    });

    it("days에 직접 insert를 못 한다", async () => {
      const { error } = await reader.client.from("days").insert({
        schedule_id: randomUUID(),
        work_date: kstMonthStart(randomOffset()),
        starts_at: "10:00",
        ends_at: "22:00",
      });
      expect(error?.code).toBe("42501");
    });

    it("slots에 직접 insert를 못 한다", async () => {
      const { error } = await reader.client.from("slots").insert({
        day_id: randomUUID(),
        positions: ["안내"],
      });
      expect(error?.code).toBe("42501");
    });

    it("assignments에 근무자가 직접 insert를 못 한다", async () => {
      const { error } = await reader.client.from("assignments").insert({
        day_id: randomUUID(),
        position: "안내",
        profile_id: reader.profileId,
        kind: "training",
      });
      expect(error?.code).toBe("42501");
    });

    it("assignments에 관리자도 직접 insert를 못 한다", async () => {
      const { error } = await admin.client.from("assignments").insert({
        day_id: randomUUID(),
        position: "안내",
        profile_id: admin.profileId,
        kind: "training",
      });
      expect(error?.code).toBe("42501");
    });

    it("position_grants에 직접 insert를 못 한다", async () => {
      const { error } = await reader.client.from("position_grants").insert({
        profile_id: reader.profileId,
        position: "스캔",
        granted_by: reader.profileId,
      });
      expect(error?.code).toBe("42501");
    });

    it("availabilities에 직접 insert를 못 한다", async () => {
      const { error } = await reader.client.from("availabilities").insert({
        profile_id: reader.profileId,
        work_date: kstMonthStart(randomOffset()),
      });
      expect(error?.code).toBe("42501");
    });

    it("requests에 직접 insert를 못 한다", async () => {
      const { error } = await reader.client.from("requests").insert({
        kind: "work",
        slot_id: randomUUID(),
        requested_by: reader.profileId,
        expires_at: new Date().toISOString(),
      });
      expect(error?.code).toBe("42501");
    });

    it("request_candidates에 직접 insert를 못 한다", async () => {
      const { error } = await reader.client.from("request_candidates").insert({
        request_id: randomUUID(),
        profile_id: reader.profileId,
        status: "pending",
        expires_at: new Date().toISOString(),
      });
      expect(error?.code).toBe("42501");
    });

    it("cancel_requests에 직접 insert를 못 한다", async () => {
      const { error } = await reader.client.from("cancel_requests").insert({
        assignment_id: randomUUID(),
        profile_id: reader.profileId,
        reason: "개인 사정",
      });
      expect(error?.code).toBe("42501");
    });
  });
});
