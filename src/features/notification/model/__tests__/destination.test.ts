// @ts-expect-error 대상 모듈이 아직 없다
const { toNotificationDestination } =
  await import("@/features/notification/model/destination");

type RawNotificationRow = {
  id: string;
  profile_id: string;
  kind: string;
  payload: Record<string, unknown>;
  subject_id: string | null;
  created_at: string;
  read_at: string | null;
  claimed_at: string | null;
  push_attempts: number;
  pushed_at: string | null;
};

function buildRow(
  kind: string,
  payload: Record<string, unknown>,
): RawNotificationRow {
  return {
    id: "notif-1",
    profile_id: "profile-1",
    kind,
    payload,
    subject_id: null,
    created_at: "2025-09-13T10:00:00+09:00",
    read_at: null,
    claimed_at: null,
    push_attempts: 0,
    pushed_at: null,
  };
}

describe("toNotificationDestination — 1차 열여덟의 목적지가 표 그대로다", () => {
  it("signup_approved는 '/'로 간다", () => {
    const row = buildRow("signup_approved", {});

    expect(toNotificationDestination(row)).toBe("/");
  });

  it("requests_open은 '/schedule?month='로 간다", () => {
    const row = buildRow("requests_open", {
      month: "2025-10",
      deadline: "2025-09-20",
    });

    expect(toNotificationDestination(row)).toBe("/schedule?month=2025-10");
  });

  it("deadline_changed는 '/schedule?month='로 간다", () => {
    const row = buildRow("deadline_changed", {
      month: "2025-10",
      deadline: "2025-09-20",
    });

    expect(toNotificationDestination(row)).toBe("/schedule?month=2025-10");
  });

  it("schedule_confirmed는 '/schedule?month='로 간다", () => {
    const row = buildRow("schedule_confirmed", { month: "2025-10" });

    expect(toNotificationDestination(row)).toBe("/schedule?month=2025-10");
  });

  it("assignment_added(들어옴)는 '/schedule?date='로 간다", () => {
    const row = buildRow("assignment_added", { work_date: "2025-09-13" });

    expect(toNotificationDestination(row)).toBe("/schedule?date=2025-09-13");
  });

  it("assignment_removed(빠짐)는 work_date가 아니라 month로 '/schedule?month='로 간다", () => {
    const row = buildRow("assignment_removed", {
      work_date: "2025-09-13",
      month: "2025-09",
    });

    expect(toNotificationDestination(row)).toBe("/schedule?month=2025-09");
  });

  it("shift_reminder는 '/schedule?date='로 간다", () => {
    const row = buildRow("shift_reminder", {
      work_date: "2025-09-13",
      start_at: "2025-09-13T09:00:00+09:00",
      position: "메인",
    });

    expect(toNotificationDestination(row)).toBe("/schedule?date=2025-09-13");
  });

  it("weekend_reminder는 첫 근무 날인 work_date로 '/schedule?date='로 간다", () => {
    const row = buildRow("weekend_reminder", {
      work_date: "2025-09-13",
      dates: ["2025-09-13", "2025-09-14"],
    });

    expect(toNotificationDestination(row)).toBe("/schedule?date=2025-09-13");
  });

  it("before_shift는 '/check-in'으로 간다", () => {
    const row = buildRow("before_shift", { work_date: "2025-09-13" });

    expect(toNotificationDestination(row)).toBe("/check-in");
  });

  it("work_requested는 '/schedule?date='로 간다", () => {
    const row = buildRow("work_requested", { work_date: "2025-09-13" });

    expect(toNotificationDestination(row)).toBe("/schedule?date=2025-09-13");
  });

  it("work_request_accepted는 관리자 근무표 '/admin/schedule?date='로 간다", () => {
    const row = buildRow("work_request_accepted", {
      actor_name: "박서연",
      work_date: "2025-09-13",
    });

    expect(toNotificationDestination(row)).toBe(
      "/admin/schedule?date=2025-09-13",
    );
  });

  it("work_request_exhausted는 관리자 근무표 '/admin/schedule?date='로 간다", () => {
    const row = buildRow("work_request_exhausted", {
      work_date: "2025-09-13",
      position: "스캔",
    });

    expect(toNotificationDestination(row)).toBe(
      "/admin/schedule?date=2025-09-13",
    );
  });

  it("cancel_requested는 '/admin/approvals'로 간다", () => {
    const row = buildRow("cancel_requested", {
      actor_name: "박서연",
      work_date: "2025-09-13",
    });

    expect(toNotificationDestination(row)).toBe("/admin/approvals");
  });

  it("cancel_approved(승인)는 month로 '/schedule?month='로 간다", () => {
    const row = buildRow("cancel_approved", {
      work_date: "2025-09-13",
      month: "2025-09",
    });

    expect(toNotificationDestination(row)).toBe("/schedule?month=2025-09");
  });

  it("cancel_rejected(거절)는 '/schedule?date='로 간다", () => {
    const row = buildRow("cancel_rejected", { work_date: "2025-09-13" });

    expect(toNotificationDestination(row)).toBe("/schedule?date=2025-09-13");
  });

  it("excuse_approved는 '/schedule?date='로 간다", () => {
    const row = buildRow("excuse_approved", { work_date: "2025-09-13" });

    expect(toNotificationDestination(row)).toBe("/schedule?date=2025-09-13");
  });

  it("excuse_rejected는 '/schedule?date='로 간다", () => {
    const row = buildRow("excuse_rejected", {
      work_date: "2025-09-13",
      reason: "지각 사유가 불충분해요",
    });

    expect(toNotificationDestination(row)).toBe("/schedule?date=2025-09-13");
  });

  it("vacancy_nudge는 관리자 근무표 '/admin/schedule?date='로 간다", () => {
    const row = buildRow("vacancy_nudge", {
      work_date: "2025-09-13",
      count: 2,
    });

    expect(toNotificationDestination(row)).toBe(
      "/admin/schedule?date=2025-09-13",
    );
  });
});

describe("toNotificationDestination — 2차 다섯(교대 넷·관리자 공지)은 목적지가 널이다", () => {
  it("admin_notice는 갈 곳이 없어 널이다", () => {
    const row = buildRow("admin_notice", { body: "다음 주 회식이 있어요" });

    expect(toNotificationDestination(row)).toBeNull();
  });

  it("swap_requested는 널이다", () => {
    const row = buildRow("swap_requested", {
      actor_name: "박서연",
      work_date: "2025-09-13",
    });

    expect(toNotificationDestination(row)).toBeNull();
  });

  it("swap_accepted는 관리자 목적지가 미정이라 널이다", () => {
    const row = buildRow("swap_accepted", { work_date: "2025-09-13" });

    expect(toNotificationDestination(row)).toBeNull();
  });

  it("swap_approved는 널이다", () => {
    const row = buildRow("swap_approved", { work_date: "2025-09-13" });

    expect(toNotificationDestination(row)).toBeNull();
  });

  it("swap_exhausted는 널이다", () => {
    const row = buildRow("swap_exhausted", { work_date: "2025-09-13" });

    expect(toNotificationDestination(row)).toBeNull();
  });
});
