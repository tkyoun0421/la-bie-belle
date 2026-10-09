import {
  summarizeAccrual,
  summarizeAmount,
} from "@/features/payrollCompute/utils/summary.utils";

const NO_ATTENDANCE = null;

function presentDay(overrides: Record<string, unknown> = {}) {
  return {
    date: "2026-09-10",
    minutes: 540,
    amount: 108000,
    kind: "normal" as const,
    attendance: {
      workDate: "2026-09-10",
      startsAt: "10:00:00",
      endsAt: "19:00:00",
      checkIn: {
        checkedAt: "2026-09-10T01:00:00.000Z",
        reportedAt: "2026-09-10T01:00:00.000Z",
        receivedAt: "2026-09-10T01:00:00.000Z",
      },
      excuses: [],
      now: "2026-09-10T01:00:00.000Z",
    },
    ...overrides,
  };
}

function lateDay(overrides: Record<string, unknown> = {}) {
  return presentDay({
    date: "2026-09-11",
    attendance: {
      workDate: "2026-09-11",
      startsAt: "10:00:00",
      endsAt: "19:00:00",
      checkIn: {
        checkedAt: "2026-09-11T01:20:00.000Z",
        reportedAt: "2026-09-11T01:20:00.000Z",
        receivedAt: "2026-09-11T01:20:00.000Z",
      },
      excuses: [],
      now: "2026-09-11T01:20:00.000Z",
    },
    ...overrides,
  });
}

function absentDay(overrides: Record<string, unknown> = {}) {
  return {
    date: "2026-09-12",
    minutes: 0,
    amount: 0,
    kind: "absent" as const,
    attendance: {
      workDate: "2026-09-12",
      startsAt: "10:00:00",
      endsAt: "19:00:00",
      checkIn: null,
      excuses: [],
      now: "2026-09-20T00:00:00.000Z",
    },
    ...overrides,
  };
}

function wagePendingDay(overrides: Record<string, unknown> = {}) {
  return {
    date: "2026-09-13",
    minutes: 480,
    amount: 0,
    kind: "wage-pending" as const,
    attendance: {
      workDate: "2026-09-13",
      startsAt: "10:00:00",
      endsAt: "18:00:00",
      checkIn: {
        checkedAt: "2026-09-13T01:00:00.000Z",
        reportedAt: "2026-09-13T01:00:00.000Z",
        receivedAt: "2026-09-13T01:00:00.000Z",
      },
      excuses: [],
      now: "2026-09-13T01:00:00.000Z",
    },
    ...overrides,
  };
}

describe("summarizeAmount — 계산할 것이 없는 기간은 –다", () => {
  it("날짜가 하나도 없으면 –다", () => {
    expect(summarizeAmount([])).toBe("–");
  });
});

describe("summarizeAmount — 결근만 있어 합이 0인 기간은 0원이다(빈 기간과 갈린다)", () => {
  it("결근한 날만 있어도 배열이 안 비었으면 0원이다", () => {
    expect(summarizeAmount([absentDay()])).toBe("0원");
  });
});

describe("summarizeAmount — 세 자리마다 쉼표를 찍고 원을 붙인다", () => {
  it("1,234,567원처럼 자릿수를 쪼갠다", () => {
    const days = [
      presentDay({ amount: 1234567 }),
      wagePendingDay({ amount: 0 }),
    ];

    expect(summarizeAmount(days)).toBe("1,234,567원");
  });
});

describe("summarizeAccrual — wage-pending인 날도 근무 회수·시간에 든다", () => {
  it("금액이 0원인 그 날도 회수 1회·그 날 분만큼을 더한다", () => {
    const accrual = summarizeAccrual([wagePendingDay({ minutes: 480 })]);

    expect(accrual.work).toBe("1회 · 8시간");
  });
});

describe("summarizeAccrual — 결근은 근무 회수·시간에서 빠진다", () => {
  it("결근한 날만 있으면 근무 0회다", () => {
    const accrual = summarizeAccrual([absentDay()]);

    expect(accrual.work).toBe("0회 · 0시간");
  });
});

describe("summarizeAccrual — 지각 판정은 getAttendanceStatus를 그대로 쓴다", () => {
  it("체크인이 지각 기준(10분)을 넘기면 지각이 1회다", () => {
    const accrual = summarizeAccrual([presentDay(), lateDay()]);

    expect(accrual.late).toBe("1회");
  });
});

describe("summarizeAccrual — 지각이 0회면 그 줄 자체가 없다", () => {
  it("지각 판정이 하나도 없으면 late가 null이다", () => {
    const accrual = summarizeAccrual([presentDay(), wagePendingDay()]);

    expect(accrual.late).toBeNull();
  });
});

describe("summarizeAccrual — 배정 없는 날(attendance가 null)은 지각 판정 대상이 아니다", () => {
  it("attendance가 null이어도 근무 회수·시간은 그대로 들어간다", () => {
    const rehearsalOnlyDay = {
      date: "2026-09-14",
      minutes: 120,
      amount: 24000,
      kind: "normal" as const,
      attendance: NO_ATTENDANCE,
    };

    const accrual = summarizeAccrual([rehearsalOnlyDay]);

    expect(accrual.work).toBe("1회 · 2시간");
    expect(accrual.late).toBeNull();
  });
});

describe("summarizeAccrual — 안에 상태를 안 둔다(기간마다 새로 셈한다)", () => {
  it("다른 기간의 날짜를 연달아 넣으면 각각 그 기간의 누적만 난다", () => {
    const first = summarizeAccrual([presentDay(), lateDay()]);
    const second = summarizeAccrual([wagePendingDay()]);

    expect(first.late).toBe("1회");
    expect(second.late).toBeNull();
    expect(second.work).toBe("1회 · 8시간");
  });
});
