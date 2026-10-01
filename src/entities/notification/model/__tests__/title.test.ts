const { toNotificationTitle } =
  await import("@/entities/notification/model/title");

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

describe("toNotificationTitle — 1차 열여덟이 표의 문장과 글자 하나까지 같다", () => {
  it("signup_approved는 '가입이 승인됐어요'다", () => {
    const row = buildRow("signup_approved", {});

    expect(toNotificationTitle(row)).toEqual({
      title: "가입이 승인됐어요",
      sub: null,
    });
  });

  it("requests_open의 title은 '10월 근무 신청을 받아요'다", () => {
    const row = buildRow("requests_open", {
      month: "2025-10",
      deadline: "2025-09-20",
    });

    expect(toNotificationTitle(row)?.title).toBe("10월 근무 신청을 받아요");
  });

  it("deadline_changed는 '10월 근무 신청 마감이 9월 20일로 바뀌었어요'다", () => {
    const row = buildRow("deadline_changed", {
      month: "2025-10",
      deadline: "2025-09-20",
    });

    expect(toNotificationTitle(row)).toEqual({
      title: "10월 근무 신청 마감이 9월 20일로 바뀌었어요",
      sub: null,
    });
  });

  it("schedule_confirmed는 '10월 근무표가 확정됐어요'다", () => {
    const row = buildRow("schedule_confirmed", { month: "2025-10" });

    expect(toNotificationTitle(row)).toEqual({
      title: "10월 근무표가 확정됐어요",
      sub: null,
    });
  });

  it("assignment_added는 '9월 13일 근무가 생겼어요'다", () => {
    const row = buildRow("assignment_added", { work_date: "2025-09-13" });

    expect(toNotificationTitle(row)).toEqual({
      title: "9월 13일 근무가 생겼어요",
      sub: null,
    });
  });

  it("assignment_removed는 '9월 13일 근무가 빠졌어요'다", () => {
    const row = buildRow("assignment_removed", {
      work_date: "2025-09-13",
      month: "2025-09",
    });

    expect(toNotificationTitle(row)).toEqual({
      title: "9월 13일 근무가 빠졌어요",
      sub: null,
    });
  });

  it("shift_reminder의 title은 '내일 근무가 있어요'다", () => {
    const row = buildRow("shift_reminder", {
      work_date: "2025-09-13",
      start_at: "2025-09-13T09:00:00+09:00",
      position: "메인",
    });

    expect(toNotificationTitle(row)?.title).toBe("내일 근무가 있어요");
  });

  it("weekend_reminder의 title은 '이번 주말 근무가 이틀 있어요'다", () => {
    const row = buildRow("weekend_reminder", {
      work_date: "2025-09-13",
      dates: ["2025-09-13", "2025-09-14"],
    });

    expect(toNotificationTitle(row)?.title).toBe(
      "이번 주말 근무가 이틀 있어요",
    );
  });

  it("before_shift는 '10분 뒤에 근무가 시작돼요'다", () => {
    const row = buildRow("before_shift", { work_date: "2025-09-13" });

    expect(toNotificationTitle(row)).toEqual({
      title: "10분 뒤에 근무가 시작돼요",
      sub: null,
    });
  });

  it("work_requested는 '9월 13일 근무를 해줄 수 있나요?'다", () => {
    const row = buildRow("work_requested", { work_date: "2025-09-13" });

    expect(toNotificationTitle(row)).toEqual({
      title: "9월 13일 근무를 해줄 수 있나요?",
      sub: null,
    });
  });

  it("work_request_accepted는 '박서연 님이 9월 13일 근무를 맡았어요'다", () => {
    const row = buildRow("work_request_accepted", {
      actor_name: "박서연",
      work_date: "2025-09-13",
    });

    expect(toNotificationTitle(row)).toEqual({
      title: "박서연 님이 9월 13일 근무를 맡았어요",
      sub: null,
    });
  });

  it("work_request_exhausted는 '9월 13일 스캔 자리를 아무도 못 맡았어요'다", () => {
    const row = buildRow("work_request_exhausted", {
      work_date: "2025-09-13",
      position: "스캔",
    });

    expect(toNotificationTitle(row)).toEqual({
      title: "9월 13일 스캔 자리를 아무도 못 맡았어요",
      sub: null,
    });
  });

  it("cancel_requested는 '박서연 님이 9월 13일 근무를 못 하겠다고 해요'다", () => {
    const row = buildRow("cancel_requested", {
      actor_name: "박서연",
      work_date: "2025-09-13",
    });

    expect(toNotificationTitle(row)).toEqual({
      title: "박서연 님이 9월 13일 근무를 못 하겠다고 해요",
      sub: null,
    });
  });

  it("cancel_approved는 '9월 13일 근무가 취소됐어요'다", () => {
    const row = buildRow("cancel_approved", {
      work_date: "2025-09-13",
      month: "2025-09",
    });

    expect(toNotificationTitle(row)).toEqual({
      title: "9월 13일 근무가 취소됐어요",
      sub: null,
    });
  });

  it("cancel_rejected는 '9월 13일 근무 취소가 거절됐어요'다", () => {
    const row = buildRow("cancel_rejected", { work_date: "2025-09-13" });

    expect(toNotificationTitle(row)).toEqual({
      title: "9월 13일 근무 취소가 거절됐어요",
      sub: null,
    });
  });

  it("excuse_approved는 '9월 13일 출근이 인정됐어요'다", () => {
    const row = buildRow("excuse_approved", { work_date: "2025-09-13" });

    expect(toNotificationTitle(row)).toEqual({
      title: "9월 13일 출근이 인정됐어요",
      sub: null,
    });
  });

  it("excuse_rejected의 title은 '9월 13일 사유가 인정되지 않았어요'다", () => {
    const row = buildRow("excuse_rejected", {
      work_date: "2025-09-13",
      reason: "지각 사유가 불충분해요",
    });

    expect(toNotificationTitle(row)?.title).toBe(
      "9월 13일 사유가 인정되지 않았어요",
    );
  });

  it("vacancy_nudge는 '9월 13일에 빈 자리가 2개 남았어요'다", () => {
    const row = buildRow("vacancy_nudge", {
      work_date: "2025-09-13",
      count: 2,
    });

    expect(toNotificationTitle(row)).toEqual({
      title: "9월 13일에 빈 자리가 2개 남았어요",
      sub: null,
    });
  });
});

describe("toNotificationTitle — 아래 줄이 있는 넷은 sub가 선다", () => {
  it("requests_open은 sub가 null이 아니다(마감일)", () => {
    const row = buildRow("requests_open", {
      month: "2025-10",
      deadline: "2025-09-20",
    });

    expect(toNotificationTitle(row)?.sub).not.toBeNull();
  });

  it("shift_reminder는 sub가 null이 아니다(시각과 포지션)", () => {
    const row = buildRow("shift_reminder", {
      work_date: "2025-09-13",
      start_at: "2025-09-13T09:00:00+09:00",
      position: "메인",
    });

    expect(toNotificationTitle(row)?.sub).not.toBeNull();
  });

  it("weekend_reminder는 sub가 null이 아니다(날짜 둘)", () => {
    const row = buildRow("weekend_reminder", {
      work_date: "2025-09-13",
      dates: ["2025-09-13", "2025-09-14"],
    });

    expect(toNotificationTitle(row)?.sub).not.toBeNull();
  });

  it("excuse_rejected는 sub가 null이 아니다(관리자가 적은 이유)", () => {
    const row = buildRow("excuse_rejected", {
      work_date: "2025-09-13",
      reason: "지각 사유가 불충분해요",
    });

    expect(toNotificationTitle(row)?.sub).not.toBeNull();
  });
});

describe("toNotificationTitle — 이름이 앞에 오는 예외 둘", () => {
  it("work_request_accepted는 날짜가 아니라 actor_name이 문장 맨 앞에 온다", () => {
    const row = buildRow("work_request_accepted", {
      actor_name: "박서연",
      work_date: "2025-09-13",
    });

    expect(toNotificationTitle(row)?.title.startsWith("박서연 님이")).toBe(
      true,
    );
  });

  it("cancel_requested는 날짜가 아니라 actor_name이 문장 맨 앞에 온다", () => {
    const row = buildRow("cancel_requested", {
      actor_name: "박서연",
      work_date: "2025-09-13",
    });

    expect(toNotificationTitle(row)?.title.startsWith("박서연 님이")).toBe(
      true,
    );
  });
});

describe("toNotificationTitle — 2차 다섯(교대 넷·관리자 공지)은 통째로 널이다", () => {
  it("admin_notice는 널이다", () => {
    const row = buildRow("admin_notice", { body: "다음 주 회식이 있어요" });

    expect(toNotificationTitle(row)).toBeNull();
  });

  it("swap_requested는 널이다", () => {
    const row = buildRow("swap_requested", {
      actor_name: "박서연",
      work_date: "2025-09-13",
    });

    expect(toNotificationTitle(row)).toBeNull();
  });

  it("swap_accepted는 널이다", () => {
    const row = buildRow("swap_accepted", { work_date: "2025-09-13" });

    expect(toNotificationTitle(row)).toBeNull();
  });

  it("swap_approved는 널이다", () => {
    const row = buildRow("swap_approved", { work_date: "2025-09-13" });

    expect(toNotificationTitle(row)).toBeNull();
  });

  it("swap_exhausted는 널이다", () => {
    const row = buildRow("swap_exhausted", { work_date: "2025-09-13" });

    expect(toNotificationTitle(row)).toBeNull();
  });
});
