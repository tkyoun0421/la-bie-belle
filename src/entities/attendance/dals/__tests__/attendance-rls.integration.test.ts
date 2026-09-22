import type { Database } from "@/shared/api/database";
import {
  createAdminUser,
  createApprovedUser,
  createLeftUser,
  execSql,
  kstDate,
  kstInstant,
  kstMonthStart,
  seedAssignment,
  withFreshMonth,
  type AdminUser,
  type ApprovedUser,
  type LeftUser,
} from "@tests/integration/postgres";
import {
  createSignedInUser,
  type SignedInUser,
} from "@tests/integration/supabase";

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
): Promise<{ dayId: string; scheduleId: string; workDate: string }> {
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
    return { dayId: data.id, scheduleId: data.schedule_id, workDate: month };
  });
}

describe("출근 인증 RLS", () => {
  let admin: AdminUser;
  let owner: ApprovedUser;
  let reader: ApprovedUser;
  let unapproved: SignedInUser;
  let leftUser: LeftUser;

  let dayId: string;
  let excuseId: string;
  let checkInId: string;
  let hallId: string;
  let hallSecretId: string;

  beforeAll(async () => {
    admin = await createAdminUser();
    owner = await createApprovedUser();
    reader = await createApprovedUser();
    unapproved = await createSignedInUser();
    leftUser = await createLeftUser();

    const seeded = await openFreshDay(admin);
    dayId = seeded.dayId;
    seedAssignment(dayId, owner.profileId, "training");
    seedAssignment(dayId, reader.profileId, "training");

    const now = new Date().toISOString();
    execSql(
      "insert into public.check_ins (id, day_id, profile_id, checked_at, reported_at, received_at, method) values (gen_random_uuid(), :'day_id', :'profile_id', :'now', :'now', :'now', 'location') returning id;\n",
      { day_id: dayId, profile_id: reader.profileId, now },
    );
    const { data: checkInRow } = await admin.client
      .from("check_ins")
      .select("id")
      .eq("day_id", dayId)
      .eq("profile_id", reader.profileId)
      .single<{ id: string }>();
    checkInId = checkInRow!.id;

    execSql(
      "insert into public.excuses (day_id, profile_id, body, decided_at, decided_by, decision) values (:'day_id', :'profile_id', '개인 사정으로 못 왔다', :'now', :'decided_by', 'approved');\n",
      {
        day_id: dayId,
        profile_id: owner.profileId,
        now,
        decided_by: admin.profileId,
      },
    );
    const { data: excuseRow } = await admin.client
      .from("excuses")
      .select("id")
      .eq("day_id", dayId)
      .eq("profile_id", owner.profileId)
      .single<{ id: string }>();
    excuseId = excuseRow!.id;

    const { data: hall } = await admin.client
      .from("halls")
      .select("id")
      .single<{ id: string }>();
    hallId = hall!.id;

    execSql(
      "insert into public.hall_secrets (hall_id, qr_code) values (:'hall_id', :'qr_code') on conflict (hall_id) do update set qr_code = excluded.qr_code returning hall_id;\n",
      { hall_id: hallId, qr_code: "seed-qr-0001" },
    );
    hallSecretId = hallId;
  });

  describe("check_ins는 기본값 — 승인된 사람 전원 읽기", () => {
    it("같이 배정된 근무자가 남의 check_ins를 읽는다", async () => {
      const { data, error } = await owner.client
        .from("check_ins")
        .select("id")
        .eq("id", checkInId);

      expect(error).toBeNull();
      expect(data).toEqual([{ id: checkInId }]);
    });

    it("승인 전에는 check_ins를 한 행도 못 읽는다", async () => {
      const { data, error } = await unapproved.client
        .from("check_ins")
        .select("id")
        .eq("id", checkInId);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("퇴사자는 check_ins를 한 행도 못 읽는다", async () => {
      const { data, error } = await leftUser.client
        .from("check_ins")
        .select("id")
        .eq("id", checkInId);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });

  describe("excuses는 본인과 관리자만 — 남의 글은 안 보인다", () => {
    it("본인은 자기 사유 글을 읽는다", async () => {
      const { data, error } = await owner.client
        .from("excuses")
        .select("id, body")
        .eq("id", excuseId);

      expect(error).toBeNull();
      expect(data).toEqual([{ id: excuseId, body: "개인 사정으로 못 왔다" }]);
    });

    it("관리자는 남의 사유 글을 읽는다", async () => {
      const { data, error } = await admin.client
        .from("excuses")
        .select("id, body")
        .eq("id", excuseId);

      expect(error).toBeNull();
      expect(data).toEqual([{ id: excuseId, body: "개인 사정으로 못 왔다" }]);
    });

    it("같이 배정된 근무자도 남의 사유 글은 못 읽는다", async () => {
      const { data, error } = await reader.client
        .from("excuses")
        .select("id, body")
        .eq("id", excuseId);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });

  describe("excuse_status 뷰는 전원이 읽되 글이 없다", () => {
    it("같이 배정된 근무자가 남의 판정을 읽는다 — body 열은 없다", async () => {
      const { data, error } = await reader.client
        .from("excuse_status")
        .select("day_id, profile_id, decision, decided_at")
        .eq("day_id", dayId)
        .eq("profile_id", owner.profileId);

      expect(error).toBeNull();
      expect(data).toEqual([
        {
          day_id: dayId,
          profile_id: owner.profileId,
          decision: "approved",
          decided_at: expect.any(String),
        },
      ]);
    });

    it("excuse_status가 body나 decision_reason 열을 안 낸다", async () => {
      const { error } = await reader.client
        .from("excuse_status")
        .select("body")
        .eq("day_id", dayId)
        .eq("profile_id", owner.profileId);

      expect(error).not.toBeNull();
    });

    it("승인 전 세션은 excuse_status가 0행이다 — security_definer라 is_approved()로 직접 좁힌다", async () => {
      const { data, error } = await unapproved.client
        .from("excuse_status")
        .select("day_id")
        .eq("day_id", dayId)
        .eq("profile_id", owner.profileId);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("퇴사자 세션은 excuse_status가 0행이다", async () => {
      const { data, error } = await leftUser.client
        .from("excuse_status")
        .select("day_id")
        .eq("day_id", dayId)
        .eq("profile_id", owner.profileId);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });

  describe("hall_secrets는 관리자만", () => {
    it("관리자는 QR 값을 읽는다", async () => {
      const { data, error } = await admin.client
        .from("hall_secrets")
        .select("hall_id")
        .eq("hall_id", hallSecretId);

      expect(error).toBeNull();
      expect(data).toEqual([{ hall_id: hallSecretId }]);
    });

    it("근무자는 QR 값을 못 읽는다 — 스캔 없이 찍는 길이 막힌다", async () => {
      const { data, error } = await owner.client
        .from("hall_secrets")
        .select("hall_id")
        .eq("hall_id", hallSecretId);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });

  describe("표 셋에 직접 못 쓴다", () => {
    it("check_ins에 근무자가 직접 insert를 못 한다", async () => {
      const { error } = await owner.client.from("check_ins").insert({
        day_id: dayId,
        profile_id: owner.profileId,
        checked_at: new Date().toISOString(),
        reported_at: new Date().toISOString(),
        received_at: new Date().toISOString(),
        method: "location",
      });
      expect(error?.code).toBe("42501");
    });

    it("check_ins에 관리자도 직접 insert를 못 한다", async () => {
      const { error } = await admin.client.from("check_ins").insert({
        day_id: dayId,
        profile_id: owner.profileId,
        checked_at: new Date().toISOString(),
        reported_at: new Date().toISOString(),
        received_at: new Date().toISOString(),
        method: "location",
      });
      expect(error?.code).toBe("42501");
    });

    it("excuses에 근무자가 직접 insert를 못 한다", async () => {
      const { error } = await owner.client.from("excuses").insert({
        day_id: dayId,
        profile_id: owner.profileId,
        body: "직접 써보는 사유",
      });
      expect(error?.code).toBe("42501");
    });

    it("excuses에 관리자도 직접 update를 못 한다", async () => {
      const { error } = await admin.client
        .from("excuses")
        .update({ decision: "rejected" })
        .eq("id", excuseId);
      expect(error?.code).toBe("42501");
    });

    it("hall_secrets에 관리자도 직접 insert를 못 한다", async () => {
      const { error } = await admin.client.from("hall_secrets").insert({
        hall_id: hallId,
        qr_code: "다른-값",
      });
      expect(error?.code).toBe("42501");
    });
  });

  describe("internal 스키마가 나중에 뚫리면 여기가 빨개진다 — 지금은 revoke 두 줄이 막는다", () => {
    let hall: { lat: number; lng: number };
    let victimOfWorker: ApprovedUser;
    let victimOfAdmin: ApprovedUser;
    let excuseVictim: ApprovedUser;
    let workerAttackDay: { dayId: string; workDate: string };
    let adminAttackDay: { dayId: string; workDate: string };
    let excuseAttackDay: { dayId: string; workDate: string };

    beforeAll(async () => {
      const { data: hallRow, error: hallError } = await admin.client
        .from("halls")
        .select("lat, lng")
        .single<{ lat: number; lng: number }>();
      if (hallError || !hallRow) {
        throw hallError ?? new Error("홀을 못 찾았다");
      }
      hall = hallRow;

      victimOfWorker = await createApprovedUser();
      victimOfAdmin = await createApprovedUser();
      excuseVictim = await createApprovedUser();

      workerAttackDay = await openFreshDay(admin);
      seedAssignment(
        workerAttackDay.dayId,
        victimOfWorker.profileId,
        "training",
      );

      adminAttackDay = await openFreshDay(admin);
      seedAssignment(adminAttackDay.dayId, victimOfAdmin.profileId, "training");

      excuseAttackDay = await openFreshDay(admin);
      seedAssignment(excuseAttackDay.dayId, excuseVictim.profileId, "training");
    });

    it("근무자 세션이 아직 안 찍은 남의 p_profile_id로 internal.check_in을 불러도 막힌다 — 실제로 뚫리면 그 사람 몫으로 행이 생겨야 하니 그 행이 없는 것으로 잰다", async () => {
      const now = kstInstant(workerAttackDay.workDate, "10:30:00");

      const { error } = await owner.client.schema("internal").rpc("check_in", {
        p_profile_id: victimOfWorker.profileId,
        p_day_id: workerAttackDay.dayId,
        p_reported_at: now,
        p_method: "location",
        p_lat: hall.lat,
        p_lng: hall.lng,
        // 이 호출은 권한에서 먼저 막혀서 QR 코드 값은 쓰이지 않는다.
        p_qr_code: "unused",
        p_now: now,
      });

      expect(error).not.toBeNull();

      const { data: stolenCheckIn } = await admin.client
        .from("check_ins")
        .select("id")
        .eq("day_id", workerAttackDay.dayId)
        .eq("profile_id", victimOfWorker.profileId);
      expect(stolenCheckIn).toEqual([]);
    });

    it("근무자 세션이 internal.submit_excuse도 못 부른다 — 실제로 뚫리면 그 사람 몫으로 사유가 생겨야 하니 그 행이 없는 것으로 잰다", async () => {
      const now = kstInstant(excuseAttackDay.workDate, "10:30:00");

      const { error } = await owner.client
        .schema("internal")
        .rpc("submit_excuse", {
          p_profile_id: excuseVictim.profileId,
          p_day_id: excuseAttackDay.dayId,
          p_body: "근무자가 남의 이름으로 낸 사유",
          p_now: now,
        });

      expect(error).not.toBeNull();

      const { data: stolenExcuse } = await admin.client
        .from("excuses")
        .select("id")
        .eq("day_id", excuseAttackDay.dayId)
        .eq("profile_id", excuseVictim.profileId);
      expect(stolenExcuse).toEqual([]);
    });

    it("관리자 세션도 internal.check_in을 못 부른다 — 역할과 무관하게 막힌다", async () => {
      const now = kstInstant(adminAttackDay.workDate, "10:30:00");

      const { error } = await admin.client.schema("internal").rpc("check_in", {
        p_profile_id: victimOfAdmin.profileId,
        p_day_id: adminAttackDay.dayId,
        p_reported_at: now,
        p_method: "location",
        p_lat: hall.lat,
        p_lng: hall.lng,
        // 이 호출은 권한에서 먼저 막혀서 QR 코드 값은 쓰이지 않는다.
        p_qr_code: "unused",
        p_now: now,
      });

      expect(error).not.toBeNull();

      const { data: stolenCheckIn } = await admin.client
        .from("check_ins")
        .select("id")
        .eq("day_id", adminAttackDay.dayId)
        .eq("profile_id", victimOfAdmin.profileId);
      expect(stolenCheckIn).toEqual([]);
    });

    it("PostgREST가 internal 스키마 자체를 모른다 — 노출 스키마 목록 밖이라는 오류다", async () => {
      const now = kstInstant(workerAttackDay.workDate, "10:30:00");

      const { error } = await owner.client.schema("internal").rpc("check_in", {
        p_profile_id: owner.profileId,
        p_day_id: workerAttackDay.dayId,
        p_reported_at: now,
        p_method: "location",
        p_lat: hall.lat,
        p_lng: hall.lng,
        // 이 호출은 권한에서 먼저 막혀서 QR 코드 값은 쓰이지 않는다.
        p_qr_code: "unused",
        p_now: now,
      });

      expect(error?.message ?? "").toMatch(/invalid schema.*internal/i);
    });
  });
});
