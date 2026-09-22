import { randomUUID } from "node:crypto";
import type { Database } from "@/shared/api/database";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  kstDate,
  kstInstant,
  kstMonthStart,
  seedAssignment,
  seedDayEndedHoursAgo,
  withFreshMonth,
  type AdminUser,
  type ApprovedUser,
} from "@tests/integration/postgres";
import { createSignedInUser } from "@tests/integration/supabase";

type FunctionName = keyof Database["public"]["Functions"];

type RpcArgs<Name extends FunctionName> = [
  Database["public"]["Functions"][Name]["Args"],
] extends [never]
  ? []
  : [args: Database["public"]["Functions"][Name]["Args"]];

async function rpcOrThrow<Name extends FunctionName>(
  admin: AdminUser,
  fn: Name,
  ...rest: RpcArgs<Name>
): Promise<void> {
  const { error } = await admin.client.rpc(fn, ...rest);
  if (error) {
    throw error;
  }
}

async function openFreshDay(
  admin: AdminUser,
): Promise<{ dayId: string; workDate: string }> {
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
    return { dayId: data.id, workDate: month };
  });
}

async function openDayWithAssignment(
  admin: AdminUser,
  profileId: string,
): Promise<{ dayId: string; workDate: string }> {
  const day = await openFreshDay(admin);
  seedAssignment(day.dayId, profileId, "training");
  return day;
}

function isoPlusSeconds(iso: string, seconds: number): string {
  return new Date(new Date(iso).getTime() + seconds * 1000).toISOString();
}

function isoPlusMinutes(iso: string, minutes: number): string {
  return isoPlusSeconds(iso, minutes * 60);
}

function isoPlusHours(iso: string, hours: number): string {
  return isoPlusSeconds(iso, hours * 3600);
}

function sqlLiteral(value: string | null): string {
  if (value === null) {
    return "null";
  }
  return `'${value.replace(/'/g, "''")}'`;
}

type CheckInArgs = {
  profileId: string;
  dayId: string;
  reportedAt: string;
  method: "location" | "qr";
  lat: number | null;
  lng: number | null;
  qrCode: string | null;
  now: string;
};

function callInternalCheckIn(args: CheckInArgs): void {
  const latSql = args.lat === null ? "null" : `${args.lat}::double precision`;
  const lngSql = args.lng === null ? "null" : `${args.lng}::double precision`;
  execSql(
    `select internal.check_in(
      ${sqlLiteral(args.profileId)}::uuid,
      ${sqlLiteral(args.dayId)}::uuid,
      ${sqlLiteral(args.reportedAt)}::timestamptz,
      ${sqlLiteral(args.method)},
      ${latSql},
      ${lngSql},
      ${sqlLiteral(args.qrCode)},
      ${sqlLiteral(args.now)}::timestamptz
    );\n`,
  );
}

type SubmitExcuseArgs = {
  profileId: string;
  dayId: string;
  body: string;
  now: string;
};

function callInternalSubmitExcuse(args: SubmitExcuseArgs): void {
  execSql(
    `select internal.submit_excuse(
      ${sqlLiteral(args.profileId)}::uuid,
      ${sqlLiteral(args.dayId)}::uuid,
      ${sqlLiteral(args.body)},
      ${sqlLiteral(args.now)}::timestamptz
    );\n`,
  );
}

function expectRpcSignatureMismatch(error: { code?: string } | null): void {
  expect(error).not.toBeNull();
  expect(error?.code).toBe("PGRST202");
}

function expectRaises(action: () => void, code: string): void {
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
  expect(stderr ?? "").toMatch(new RegExp(`ERROR:\\s+${code}`));
}

async function checkedAtFor(
  admin: AdminUser,
  dayId: string,
  profileId: string,
): Promise<string> {
  const { data, error } = await admin.client
    .from("check_ins")
    .select("checked_at")
    .eq("day_id", dayId)
    .eq("profile_id", profileId)
    .single<{ checked_at: string }>();
  if (error || !data) {
    throw error ?? new Error("찍힌 인증을 못 찾았다");
  }
  return data.checked_at;
}

function expectCloseTime(
  actualIso: string,
  expectedIso: string,
  toleranceMs = 3000,
): void {
  const diff = Math.abs(
    new Date(actualIso).getTime() - new Date(expectedIso).getTime(),
  );
  expect(diff).toBeLessThanOrEqual(toleranceMs);
}

// 정북(방위각 0)으로 distanceM 만큼 간 점이다. 방위각이 0이면 경도는 그대로고 위도만
// 각거리 만큼 움직인다 — 그래야 haversine이 되돌려 재는 값이 distanceM 그대로다.
function destinationPoint(
  lat: number,
  lng: number,
  distanceM: number,
): { lat: number; lng: number } {
  const R = 6371000;
  const lat1 = (lat * Math.PI) / 180;
  const angular = distanceM / R;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular),
  );

  return { lat: (lat2 * 180) / Math.PI, lng };
}

describe("출근 인증 함수", () => {
  let admin: AdminUser;
  let worker: ApprovedUser;
  let noAssignmentWorker: ApprovedUser;
  let hall: { id: string; lat: number; lng: number; radiusM: number };

  beforeAll(async () => {
    admin = await createAdminUser();
    worker = await createApprovedUser();
    noAssignmentWorker = await createApprovedUser();

    const { data, error } = await admin.client
      .from("halls")
      .select("id, lat, lng, radius_m")
      .single<{ id: string; lat: number; lng: number; radius_m: number }>();
    if (error || !data) {
      throw error ?? new Error("홀을 못 찾았다");
    }
    hall = {
      id: data.id,
      lat: data.lat,
      lng: data.lng,
      radiusM: data.radius_m,
    };
  });

  describe("internal.check_in — 인증 창", () => {
    it("근무 시작 1시간 전 1초 전이면 window_closed", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const opensAt = kstInstant(workDate, "09:00:00");
      const now = isoPlusSeconds(opensAt, -1);

      expectRaises(
        () =>
          callInternalCheckIn({
            profileId: worker.profileId,
            dayId,
            reportedAt: now,
            method: "location",
            lat: hall.lat,
            lng: hall.lng,
            qrCode: null,
            now,
          }),
        "window_closed",
      );
    });

    it("근무 시작 1시간 전 정각이면 통과한다", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const now = kstInstant(workDate, "09:00:00");

      expect(() =>
        callInternalCheckIn({
          profileId: worker.profileId,
          dayId,
          reportedAt: now,
          method: "location",
          lat: hall.lat,
          lng: hall.lng,
          qrCode: null,
          now,
        }),
      ).not.toThrow();
    });

    it("그날 18시 정각이면 통과한다", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const now = kstInstant(workDate, "18:00:00");

      expect(() =>
        callInternalCheckIn({
          profileId: worker.profileId,
          dayId,
          reportedAt: now,
          method: "location",
          lat: hall.lat,
          lng: hall.lng,
          qrCode: null,
          now,
        }),
      ).not.toThrow();
    });

    it("그날 18시 1초 뒤면 window_closed", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const closesAt = kstInstant(workDate, "18:00:00");
      const now = isoPlusSeconds(closesAt, 1);

      expectRaises(
        () =>
          callInternalCheckIn({
            profileId: worker.profileId,
            dayId,
            reportedAt: now,
            method: "location",
            lat: hall.lat,
            lng: hall.lng,
            qrCode: null,
            now,
          }),
        "window_closed",
      );
    });
  });

  describe("internal.check_in — 그날 살아 있는 배정", () => {
    it("배정이 없으면 not_allowed", async () => {
      const { dayId, workDate } = await openFreshDay(admin);
      const now = kstInstant(workDate, "10:30:00");

      expectRaises(
        () =>
          callInternalCheckIn({
            profileId: noAssignmentWorker.profileId,
            dayId,
            reportedAt: now,
            method: "location",
            lat: hall.lat,
            lng: hall.lng,
            qrCode: null,
            now,
          }),
        "not_allowed",
      );
    });
  });

  describe("internal.check_in — checked_at 한도", () => {
    it("reported_at이 10분 넘게 이르면 checked_at은 now로 눌린다", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const now = kstInstant(workDate, "10:30:00");
      const reportedAt = isoPlusMinutes(now, -15);

      callInternalCheckIn({
        profileId: worker.profileId,
        dayId,
        reportedAt,
        method: "location",
        lat: hall.lat,
        lng: hall.lng,
        qrCode: null,
        now,
      });

      const checkedAt = await checkedAtFor(admin, dayId, worker.profileId);
      expectCloseTime(checkedAt, now);
    });

    it("reported_at이 미래면 checked_at은 now로 눌린다", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const now = kstInstant(workDate, "10:30:00");
      const reportedAt = isoPlusMinutes(now, 5);

      callInternalCheckIn({
        profileId: worker.profileId,
        dayId,
        reportedAt,
        method: "location",
        lat: hall.lat,
        lng: hall.lng,
        qrCode: null,
        now,
      });

      const checkedAt = await checkedAtFor(admin, dayId, worker.profileId);
      expectCloseTime(checkedAt, now);
    });

    it("reported_at이 10분 안이면 그대로 checked_at이 된다", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const now = kstInstant(workDate, "10:30:00");
      const reportedAt = isoPlusMinutes(now, -3);

      callInternalCheckIn({
        profileId: worker.profileId,
        dayId,
        reportedAt,
        method: "location",
        lat: hall.lat,
        lng: hall.lng,
        qrCode: null,
        now,
      });

      const checkedAt = await checkedAtFor(admin, dayId, worker.profileId);
      expectCloseTime(checkedAt, reportedAt);
    });
  });

  describe("internal.check_in — 중복 호출", () => {
    it("두 번 연속 부르면 둘째는 already_done이고 행은 하나다", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const now = kstInstant(workDate, "10:30:00");
      const args: CheckInArgs = {
        profileId: worker.profileId,
        dayId,
        reportedAt: now,
        method: "location",
        lat: hall.lat,
        lng: hall.lng,
        qrCode: null,
        now,
      };

      callInternalCheckIn(args);
      expectRaises(() => callInternalCheckIn(args), "already_done");

      const { data, error } = await admin.client
        .from("check_ins")
        .select("id")
        .eq("day_id", dayId)
        .eq("profile_id", worker.profileId);
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });
  });

  describe("internal.check_in — 위치 반경(100m로 좁힌 뒤)", () => {
    afterAll(() => {
      execSql(
        "update public.halls set lat = :'lat', lng = :'lng', radius_m = :'radius_m' where id = :'hall_id';\n",
        {
          lat: String(hall.lat),
          lng: String(hall.lng),
          radius_m: String(hall.radiusM),
          hall_id: hall.id,
        },
      );
    });

    beforeAll(async () => {
      await rpcOrThrow(admin, "set_hall_location", {
        p_lat: hall.lat,
        p_lng: hall.lng,
        p_radius_m: 100,
      });
    });

    it("99미터면 통과한다", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const now = kstInstant(workDate, "10:30:00");
      const point = destinationPoint(hall.lat, hall.lng, 99);

      expect(() =>
        callInternalCheckIn({
          profileId: worker.profileId,
          dayId,
          reportedAt: now,
          method: "location",
          lat: point.lat,
          lng: point.lng,
          qrCode: null,
          now,
        }),
      ).not.toThrow();
    });

    it("100미터면 통과한다 — 경계 동일", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const now = kstInstant(workDate, "10:30:00");
      const point = destinationPoint(hall.lat, hall.lng, 100);

      expect(() =>
        callInternalCheckIn({
          profileId: worker.profileId,
          dayId,
          reportedAt: now,
          method: "location",
          lat: point.lat,
          lng: point.lng,
          qrCode: null,
          now,
        }),
      ).not.toThrow();
    });

    it("101미터면 too_far", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const now = kstInstant(workDate, "10:30:00");
      const point = destinationPoint(hall.lat, hall.lng, 101);

      expectRaises(
        () =>
          callInternalCheckIn({
            profileId: worker.profileId,
            dayId,
            reportedAt: now,
            method: "location",
            lat: point.lat,
            lng: point.lng,
            qrCode: null,
            now,
          }),
        "too_far",
      );
    });
  });

  describe("internal.check_in — QR", () => {
    let qrCode: string;

    beforeAll(() => {
      qrCode = `seed-${randomUUID()}`;
      execSql(
        "insert into public.hall_secrets (hall_id, qr_code) values (:'hall_id', :'qr_code') on conflict (hall_id) do update set qr_code = excluded.qr_code;\n",
        { hall_id: hall.id, qr_code: qrCode },
      );
    });

    it("옛 코드면 invalid_qr", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const now = kstInstant(workDate, "10:30:00");

      expectRaises(
        () =>
          callInternalCheckIn({
            profileId: worker.profileId,
            dayId,
            reportedAt: now,
            method: "qr",
            lat: null,
            lng: null,
            qrCode: "이미-죽은-코드",
            now,
          }),
        "invalid_qr",
      );
    });

    it("현재 코드면 통과한다", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const now = kstInstant(workDate, "10:30:00");

      expect(() =>
        callInternalCheckIn({
          profileId: worker.profileId,
          dayId,
          reportedAt: now,
          method: "qr",
          lat: null,
          lng: null,
          qrCode,
          now,
        }),
      ).not.toThrow();
    });
  });

  describe("internal.check_in — 검사 순서(거친 것부터)", () => {
    it("창 밖이면서 QR도 틀리면 invalid_qr이 아니라 window_closed다", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const closesAt = kstInstant(workDate, "18:00:00");
      const now = isoPlusHours(closesAt, 1);

      expectRaises(
        () =>
          callInternalCheckIn({
            profileId: worker.profileId,
            dayId,
            reportedAt: now,
            method: "qr",
            lat: null,
            lng: null,
            qrCode: "존재하지-않는-코드",
            now,
          }),
        "window_closed",
      );
    });

    it("배정도 없고 창도 닫혔으면 window_closed가 아니라 not_allowed다", async () => {
      const { dayId, workDate } = await openFreshDay(admin);
      const closesAt = kstInstant(workDate, "18:00:00");
      const now = isoPlusHours(closesAt, 1);

      expectRaises(
        () =>
          callInternalCheckIn({
            profileId: noAssignmentWorker.profileId,
            dayId,
            reportedAt: now,
            method: "location",
            lat: hall.lat,
            lng: hall.lng,
            qrCode: null,
            now,
          }),
        "not_allowed",
      );
    });
  });

  describe("public.check_in — 껍데기", () => {
    it("p_profile_id를 받지 않는다 — 클라이언트가 남의 이름으로 못 찍는다", async () => {
      const { dayId } = await openDayWithAssignment(admin, worker.profileId);

      // 없는 인자를 일부러 넘겨 시그니처 불일치를 확인하는 자리다 — 생성 타입이 막는 게 맞다.
      const { error } = await worker.client.rpc("check_in", {
        p_profile_id: worker.profileId,
        p_day_id: dayId,
        p_reported_at: new Date().toISOString(),
        p_method: "location",
        p_lat: hall.lat,
        p_lng: hall.lng,
      } as unknown as Database["public"]["Functions"]["check_in"]["Args"]);
      expectRpcSignatureMismatch(error);
    });

    it("승인 전 세션이 부르면 not_allowed", async () => {
      const { dayId } = await openFreshDay(admin);
      const unapproved = await createSignedInUser();

      const { error } = await unapproved.client.rpc("check_in", {
        p_day_id: dayId,
        p_reported_at: new Date().toISOString(),
        p_method: "location",
        p_lat: hall.lat,
        p_lng: hall.lng,
      });
      expect(error?.message).toBe("not_allowed");
    });

    it("이미 지난 근무일이면 now()를 넘긴 판정대로 window_closed", async () => {
      const past = await seedDayEndedHoursAgo(admin, 200);
      seedAssignment(past.dayId, worker.profileId, "training");

      const { error } = await worker.client.rpc("check_in", {
        p_day_id: past.dayId,
        p_reported_at: new Date().toISOString(),
        p_method: "location",
        p_lat: hall.lat,
        p_lng: hall.lng,
      });
      expect(error?.message).toBe("window_closed");
    });
  });
});

describe("사유 함수", () => {
  let admin: AdminUser;
  let worker: ApprovedUser;
  let noAssignmentWorker: ApprovedUser;

  beforeAll(async () => {
    admin = await createAdminUser();
    worker = await createApprovedUser();
    noAssignmentWorker = await createApprovedUser();
  });

  describe("internal.submit_excuse — 호출자와 전제", () => {
    it("그날 자기 배정이 없으면 not_allowed", async () => {
      const { dayId, workDate } = await openFreshDay(admin);
      const now = isoPlusHours(kstInstant(workDate, "22:00:00"), 1);

      expectRaises(
        () =>
          callInternalSubmitExcuse({
            profileId: noAssignmentWorker.profileId,
            dayId,
            body: "사정이 있었다",
            now,
          }),
        "not_allowed",
      );
    });

    it("이미 찍혀 있으면 already_done", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const now = isoPlusHours(kstInstant(workDate, "22:00:00"), 1);
      execSql(
        "insert into public.check_ins (day_id, profile_id, checked_at, reported_at, received_at, method) values (:'day_id', :'profile_id', :'now', :'now', :'now', 'location');\n",
        { day_id: dayId, profile_id: worker.profileId, now },
      );

      expectRaises(
        () =>
          callInternalSubmitExcuse({
            profileId: worker.profileId,
            dayId,
            body: "사정이 있었다",
            now,
          }),
        "already_done",
      );
    });
  });

  describe("internal.submit_excuse — 글", () => {
    it("빈 문자열이면 invalid_reason", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const now = isoPlusHours(kstInstant(workDate, "22:00:00"), 1);

      expectRaises(
        () =>
          callInternalSubmitExcuse({
            profileId: worker.profileId,
            dayId,
            body: "   ",
            now,
          }),
        "invalid_reason",
      );
    });

    it("200자를 넘으면 invalid_reason", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const now = isoPlusHours(kstInstant(workDate, "22:00:00"), 1);

      expectRaises(
        () =>
          callInternalSubmitExcuse({
            profileId: worker.profileId,
            dayId,
            body: "가".repeat(201),
            now,
          }),
        "invalid_reason",
      );
    });
  });

  describe("internal.submit_excuse — 중복", () => {
    it("살아 있는 사유가 있으면 already_requested", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const now = isoPlusHours(kstInstant(workDate, "22:00:00"), 1);
      execSql(
        "insert into public.excuses (day_id, profile_id, body) values (:'day_id', :'profile_id', '먼저 낸 사유');\n",
        { day_id: dayId, profile_id: worker.profileId },
      );

      expectRaises(
        () =>
          callInternalSubmitExcuse({
            profileId: worker.profileId,
            dayId,
            body: "다시 내는 사유",
            now,
          }),
        "already_requested",
      );
    });

    it("승인된 사유가 있으면 already_requested", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const now = isoPlusHours(kstInstant(workDate, "22:00:00"), 1);
      execSql(
        "insert into public.excuses (day_id, profile_id, body, decided_at, decided_by, decision) values (:'day_id', :'profile_id', '이미 승인됨', :'now', :'decided_by', 'approved');\n",
        {
          day_id: dayId,
          profile_id: worker.profileId,
          now,
          decided_by: admin.profileId,
        },
      );

      expectRaises(
        () =>
          callInternalSubmitExcuse({
            profileId: worker.profileId,
            dayId,
            body: "다시 내는 사유",
            now,
          }),
        "already_requested",
      );
    });

    it("거절된 사유만 있으면 다시 낼 수 있다", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const now = isoPlusHours(kstInstant(workDate, "22:00:00"), 1);
      execSql(
        "insert into public.excuses (day_id, profile_id, body, decided_at, decided_by, decision, decision_reason) values (:'day_id', :'profile_id', '거절된 사유', :'now', :'decided_by', 'rejected', '못 믿겠다');\n",
        {
          day_id: dayId,
          profile_id: worker.profileId,
          now,
          decided_by: admin.profileId,
        },
      );

      expect(() =>
        callInternalSubmitExcuse({
          profileId: worker.profileId,
          dayId,
          body: "다시 내는 사유",
          now,
        }),
      ).not.toThrow();

      const { data, error: readError } = await admin.client
        .from("excuses")
        .select("id")
        .eq("day_id", dayId)
        .eq("profile_id", worker.profileId);
      expect(readError).toBeNull();
      expect(data).toHaveLength(2);
    });
  });

  describe("internal.submit_excuse — 근무 끝 48시간", () => {
    it("47시간 지났으면 통과한다 — 경계 직전", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const workEndsAt = kstInstant(workDate, "22:00:00");
      const now = isoPlusHours(workEndsAt, 47);

      expect(() =>
        callInternalSubmitExcuse({
          profileId: worker.profileId,
          dayId,
          body: "47시간에 냈다",
          now,
        }),
      ).not.toThrow();
    });

    it("48시간 지났으면 통과한다 — 경계 동일", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const workEndsAt = kstInstant(workDate, "22:00:00");
      const now = isoPlusHours(workEndsAt, 48);

      expect(() =>
        callInternalSubmitExcuse({
          profileId: worker.profileId,
          dayId,
          body: "48시간 정각에 냈다",
          now,
        }),
      ).not.toThrow();
    });

    it("49시간 지났으면 window_closed — 경계 직후", async () => {
      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const workEndsAt = kstInstant(workDate, "22:00:00");
      const now = isoPlusHours(workEndsAt, 49);

      expectRaises(
        () =>
          callInternalSubmitExcuse({
            profileId: worker.profileId,
            dayId,
            body: "너무 늦게 냈다",
            now,
          }),
        "window_closed",
      );
    });
  });

  describe("public.submit_excuse — 껍데기", () => {
    it("p_profile_id를 받지 않는다 — 클라이언트가 남의 이름으로 못 낸다", async () => {
      const { dayId } = await openDayWithAssignment(admin, worker.profileId);

      const { error } = await worker.client.rpc("submit_excuse", {
        p_profile_id: worker.profileId,
        p_day_id: dayId,
        p_body: "사정이 있었다",
      });
      expectRpcSignatureMismatch(error);
    });

    it("승인 전 세션이 부르면 not_allowed", async () => {
      const { dayId } = await openFreshDay(admin);
      const unapproved = await createSignedInUser();

      const { error } = await unapproved.client.rpc("submit_excuse", {
        p_day_id: dayId,
        p_body: "사정이 있었다",
      });
      expect(error?.message).toBe("not_allowed");
    });

    it("이미 지난 근무일이면 now()를 넘긴 판정대로 window_closed", async () => {
      const past = await seedDayEndedHoursAgo(admin, 200);
      seedAssignment(past.dayId, worker.profileId, "training");

      const { error } = await worker.client.rpc("submit_excuse", {
        p_day_id: past.dayId,
        p_body: "너무 늦게 냈다",
      });
      expect(error?.message).toBe("window_closed");
    });
  });

  describe("decide_excuse", () => {
    async function seedPendingExcuse(
      hoursAgo: number,
    ): Promise<{ excuseId: string }> {
      const past = await seedDayEndedHoursAgo(admin, hoursAgo);
      seedAssignment(past.dayId, worker.profileId, "training");
      execSql(
        "insert into public.excuses (day_id, profile_id, body) values (:'day_id', :'profile_id', '판정 대기 사유');\n",
        { day_id: past.dayId, profile_id: worker.profileId },
      );
      const { data, error } = await admin.client
        .from("excuses")
        .select("id")
        .eq("day_id", past.dayId)
        .eq("profile_id", worker.profileId)
        .single<{ id: string }>();
      if (error || !data) {
        throw error ?? new Error("사유를 못 찾았다");
      }
      return { excuseId: data.id };
    }

    it("근무자가 부르면 not_allowed", async () => {
      const { excuseId } = await seedPendingExcuse(1);

      const { error } = await worker.client.rpc("decide_excuse", {
        p_excuse_id: excuseId,
        p_approved: true,
      });
      expect(error?.message).toBe("not_allowed");
    });

    it("이미 판정됐으면 already_decided", async () => {
      const { excuseId } = await seedPendingExcuse(1);
      await rpcOrThrow(admin, "decide_excuse", {
        p_excuse_id: excuseId,
        p_approved: true,
      });

      const { error } = await admin.client.rpc("decide_excuse", {
        p_excuse_id: excuseId,
        p_approved: true,
      });
      expect(error?.message).toBe("already_decided");
    });

    it("48시간이 지나 결근으로 남은 날도 판정한다 — 시한이 없다", async () => {
      const { excuseId } = await seedPendingExcuse(200);

      const { error } = await admin.client.rpc("decide_excuse", {
        p_excuse_id: excuseId,
        p_approved: true,
      });
      expect(error).toBeNull();

      const { data, error: readError } = await admin.client
        .from("excuses")
        .select("decided_at, decision")
        .eq("id", excuseId)
        .single<{ decided_at: string | null; decision: string | null }>();
      expect(readError).toBeNull();
      expect(data?.decided_at).not.toBeNull();
      expect(data?.decision).toBe("approved");
    });

    it("거절인데 이유가 없으면 invalid_reason", async () => {
      const { excuseId } = await seedPendingExcuse(1);

      const { error } = await admin.client.rpc("decide_excuse", {
        p_excuse_id: excuseId,
        p_approved: false,
        p_reason: "",
      });
      expect(error?.message).toBe("invalid_reason");
    });

    it("거절 이유가 있으면 통과하고 그 글이 남는다", async () => {
      const { excuseId } = await seedPendingExcuse(1);

      const { error } = await admin.client.rpc("decide_excuse", {
        p_excuse_id: excuseId,
        p_approved: false,
        p_reason: "증빙이 부족하다",
      });
      expect(error).toBeNull();

      const { data, error: readError } = await admin.client
        .from("excuses")
        .select("decision, decision_reason")
        .eq("id", excuseId)
        .single<{ decision: string | null; decision_reason: string | null }>();
      expect(readError).toBeNull();
      expect(data?.decision).toBe("rejected");
      expect(data?.decision_reason).toBe("증빙이 부족하다");
    });
  });
});

describe("QR과 홀 함수", () => {
  let admin: AdminUser;
  let worker: ApprovedUser;
  let hallId: string;
  let originalHall: { lat: number; lng: number; radiusM: number };

  beforeAll(async () => {
    admin = await createAdminUser();
    worker = await createApprovedUser();

    const { data, error } = await admin.client
      .from("halls")
      .select("id, lat, lng, radius_m")
      .single<{ id: string; lat: number; lng: number; radius_m: number }>();
    if (error || !data) {
      throw error ?? new Error("홀을 못 찾았다");
    }
    hallId = data.id;
    originalHall = { lat: data.lat, lng: data.lng, radiusM: data.radius_m };
  });

  afterAll(() => {
    execSql(
      "update public.halls set lat = :'lat', lng = :'lng', radius_m = :'radius_m' where id = :'hall_id';\n",
      {
        lat: String(originalHall.lat),
        lng: String(originalHall.lng),
        radius_m: String(originalHall.radiusM),
        hall_id: hallId,
      },
    );
  });

  describe("rotate_qr", () => {
    it("근무자가 부르면 not_allowed", async () => {
      const { error } = await worker.client.rpc("rotate_qr");
      expect(error?.message).toBe("not_allowed");
    });

    it("관리자가 부르면 hall_secrets가 서고 코드가 바뀐다", async () => {
      const { error: firstError } = await admin.client.rpc("rotate_qr");
      expect(firstError).toBeNull();

      const { data: firstRow } = await admin.client
        .from("hall_secrets")
        .select("qr_code, rotated_at")
        .eq("hall_id", hallId)
        .single<{ qr_code: string; rotated_at: string }>();

      const { error: secondError } = await admin.client.rpc("rotate_qr");
      expect(secondError).toBeNull();

      const { data: secondRow } = await admin.client
        .from("hall_secrets")
        .select("qr_code, rotated_at")
        .eq("hall_id", hallId)
        .single<{ qr_code: string; rotated_at: string }>();

      expect(secondRow?.qr_code).not.toBe(firstRow?.qr_code);
      expect(secondRow?.rotated_at).not.toBe(firstRow?.rotated_at);
    });

    it("돌린 뒤 옛 코드로 찍으면 invalid_qr", async () => {
      const { data: before } = await admin.client
        .from("hall_secrets")
        .select("qr_code")
        .eq("hall_id", hallId)
        .single<{ qr_code: string }>();
      const oldCode = before!.qr_code;

      await rpcOrThrow(admin, "rotate_qr");

      const { dayId, workDate } = await openDayWithAssignment(
        admin,
        worker.profileId,
      );
      const now = kstInstant(workDate, "10:30:00");

      expectRaises(
        () =>
          callInternalCheckIn({
            profileId: worker.profileId,
            dayId,
            reportedAt: now,
            method: "qr",
            lat: null,
            lng: null,
            qrCode: oldCode,
            now,
          }),
        "invalid_qr",
      );
    });
  });

  describe("set_hall_location", () => {
    it("근무자가 부르면 not_allowed", async () => {
      const { error } = await worker.client.rpc("set_hall_location", {
        p_lat: 37.5,
        p_lng: 127.1,
        p_radius_m: 150,
      });
      expect(error?.message).toBe("not_allowed");
    });

    it("반경이 0이면 bad_radius", async () => {
      const { error } = await admin.client.rpc("set_hall_location", {
        p_lat: 37.5,
        p_lng: 127.1,
        p_radius_m: 0,
      });
      expect(error?.message).toBe("bad_radius");
    });

    it("위도가 범위 밖이면 bad_radius", async () => {
      const { error } = await admin.client.rpc("set_hall_location", {
        p_lat: 91,
        p_lng: 127.1,
        p_radius_m: 150,
      });
      expect(error?.message).toBe("bad_radius");
    });

    it("관리자가 부르면 홀 좌표·반경이 바뀐다", async () => {
      const { error } = await admin.client.rpc("set_hall_location", {
        p_lat: 37.55,
        p_lng: 127.05,
        p_radius_m: 150,
      });
      expect(error).toBeNull();

      const { data, error: readError } = await admin.client
        .from("halls")
        .select("lat, lng, radius_m")
        .eq("id", hallId)
        .single<{ lat: number; lng: number; radius_m: number }>();
      expect(readError).toBeNull();
      expect(data?.lat).toBeCloseTo(37.55, 5);
      expect(data?.lng).toBeCloseTo(127.05, 5);
      expect(data?.radius_m).toBe(150);
    });
  });
});
