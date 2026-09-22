import {
  getAttendanceStatus,
  type AttendanceStatusInput,
  type ExcuseStatusRecord,
} from "@/features/attendance/model/attendance-status";

/**
 * 기준 근무일 — 2026-09-10(KST), 10:00 시작·19:00 끝.
 *
 * KST(UTC+9) 환산:
 *   인증 창 시작(시작 1시간 전, 09:00 KST)  = 2026-09-10T00:00:00.000Z
 *   지각 경계(시작+10분, 10:10 KST)         = 2026-09-10T01:10:00.000Z
 *   인증 창 닫힘(18:00 KST, 고정)            = 2026-09-10T09:00:00.000Z
 *   사유 마감(끝난 시각+48시간, 19:00+48h)   = 2026-09-12T10:00:00.000Z
 */
const WORK_DATE = "2026-09-10";
const STARTS_AT = "10:00:00";
const ENDS_AT = "19:00:00";

const WINDOW_START = "2026-09-10T00:00:00.000Z";
const BEFORE_WINDOW_START = "2026-09-09T23:59:59.000Z";

const LATE_BOUNDARY = "2026-09-10T01:10:00.000Z";
const AFTER_LATE_BOUNDARY = "2026-09-10T01:10:01.000Z";

const AFTER_CHECK_IN_WINDOW_CLOSE = "2026-09-10T09:00:01.000Z";

const EXCUSE_DEADLINE = "2026-09-12T10:00:00.000Z";
const AFTER_EXCUSE_DEADLINE = "2026-09-12T10:00:01.000Z";
const LONG_AFTER_EXCUSE_DEADLINE = "2026-09-13T00:00:00.000Z";

function buildInput(
  overrides: Partial<AttendanceStatusInput> = {},
): AttendanceStatusInput {
  return {
    workDate: WORK_DATE,
    startsAt: STARTS_AT,
    endsAt: ENDS_AT,
    checkIn: null,
    excuses: [],
    now: WINDOW_START,
    ...overrides,
  };
}

function rejectedExcuse(
  overrides: Partial<ExcuseStatusRecord> = {},
): ExcuseStatusRecord {
  return {
    submittedAt: "2026-09-10T10:00:00.000Z",
    decidedAt: "2026-09-10T11:00:00.000Z",
    decision: "rejected",
    ...overrides,
  };
}

describe("getAttendanceStatus — 저장하지 않는 상태 여섯을 그때 계산한다", () => {
  it("인증 창이 열리기 전이면 상태 자체가 없다", () => {
    const status = getAttendanceStatus(
      buildInput({ now: BEFORE_WINDOW_START }),
    );

    expect(status).toBeNull();
  });

  it("인증 창이 열리는 순간부터 안 찍음이다 — 경계 동일", () => {
    const status = getAttendanceStatus(buildInput({ now: WINDOW_START }));

    expect(status).toBe("unmarked");
  });

  it("근무 시작에서 정확히 10분에 찍으면 출근이다 — 10분을 넘겨야 지각이다(ATT-016)", () => {
    const status = getAttendanceStatus(
      buildInput({
        now: LATE_BOUNDARY,
        checkIn: {
          checkedAt: LATE_BOUNDARY,
          reportedAt: LATE_BOUNDARY,
          receivedAt: LATE_BOUNDARY,
        },
      }),
    );

    expect(status).toBe("present");
  });

  it("근무 시작에서 10분 1초를 넘겨 찍으면 지각이다", () => {
    const status = getAttendanceStatus(
      buildInput({
        now: AFTER_LATE_BOUNDARY,
        checkIn: {
          checkedAt: AFTER_LATE_BOUNDARY,
          reportedAt: AFTER_LATE_BOUNDARY,
          receivedAt: AFTER_LATE_BOUNDARY,
        },
      }),
    );

    expect(status).toBe("late");
  });

  it("check_ins가 없고 살아 있는 사유가 있으면 확인 중이다 — 관리자에게 시한이 없다(ATT-015)", () => {
    const status = getAttendanceStatus(
      buildInput({
        now: LONG_AFTER_EXCUSE_DEADLINE,
        excuses: [
          {
            submittedAt: "2026-09-10T10:00:00.000Z",
            decidedAt: null,
            decision: null,
          },
        ],
      }),
    );

    expect(status).toBe("pending");
  });

  it("사유가 승인되면 출근 인정이다 — 인증 창이 닫히고 사유 마감도 지나도 그대로다", () => {
    const status = getAttendanceStatus(
      buildInput({
        now: LONG_AFTER_EXCUSE_DEADLINE,
        excuses: [
          {
            submittedAt: "2026-09-10T10:00:00.000Z",
            decidedAt: "2026-09-10T12:00:00.000Z",
            decision: "approved",
          },
        ],
      }),
    );

    expect(status).toBe("excused");
  });

  it("거절된 사유만 있고 사유 마감이 아직이면 결근이 아니다 — 경계 동일(48시간까지)", () => {
    const status = getAttendanceStatus(
      buildInput({
        now: EXCUSE_DEADLINE,
        excuses: [rejectedExcuse()],
      }),
    );

    expect(status).toBe("unmarked");
  });

  it("거절된 사유만 있고 사유 마감이 지나면 결근이다 — 거절이 결근을 막지 않는다(ATT-014)", () => {
    const status = getAttendanceStatus(
      buildInput({
        now: AFTER_EXCUSE_DEADLINE,
        excuses: [rejectedExcuse()],
      }),
    );

    expect(status).toBe("absent");
  });

  it("사유가 아예 없어도 사유 마감이 지나면 결근이다", () => {
    const status = getAttendanceStatus(
      buildInput({ now: AFTER_EXCUSE_DEADLINE, excuses: [] }),
    );

    expect(status).toBe("absent");
  });

  it("인증 창(18시)이 닫힌 뒤라도 사유 마감 48시간 안에는 결근이 아니다", () => {
    const status = getAttendanceStatus(
      buildInput({ now: AFTER_CHECK_IN_WINDOW_CLOSE, excuses: [] }),
    );

    expect(status).toBe("unmarked");
  });

  it("사유 배열이 제출 시각 순으로 정렬돼 있지 않아도 살아 있는 사유를 찾아 확인 중으로 낸다", () => {
    const status = getAttendanceStatus(
      buildInput({
        now: LONG_AFTER_EXCUSE_DEADLINE,
        excuses: [
          rejectedExcuse({ submittedAt: "2026-09-05T00:00:00.000Z" }),
          {
            submittedAt: "2026-09-11T00:00:00.000Z",
            decidedAt: null,
            decision: null,
          },
        ],
      }),
    );

    expect(status).toBe("pending");
  });
});
