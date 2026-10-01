// 구현 대상: src/screens/payroll/utils/historyRows.utils.ts
//
// PayrollHistoryDay = { date, amount, kind, position, startsAt, endsAt,
// isEducation, overtimeMinutes }다. position·startsAt·endsAt은 배정이 없는 날
// (리허설만 있는 날)에는 null이다.
//
// payrollHistoryRows(days) — 내역 줄이다(payroll.md 「내역 목록」). 최근 날짜가
// 위로 온다. 결근은 금액 '–'에 보조 정보 '결근', wage-pending은 금액 '–'에
// 보조 정보 뒤에 '시급 미정'이 붙는다. 연장이 붙은 날은 초과분을
// '연장 1시간'·'연장 1시간 30분'·'연장 30분'으로 적는다. 교육 배정은 포지션
// 뒤에 '교육'이 붙는다('메인 교육 · 10:00–19:00').

import { payrollHistoryRows } from "@/screens/payroll/utils/historyRows.utils";

function normalDay(overrides: Record<string, unknown> = {}) {
  return {
    date: "2026-10-07",
    amount: 108000,
    kind: "normal" as const,
    position: "메인",
    startsAt: "10:00",
    endsAt: "19:00",
    isEducation: false,
    overtimeMinutes: 0,
    ...overrides,
  };
}

describe("payrollHistoryRows — 연장이 정각이면 '연장 1시간'이다", () => {
  it("초과분 60분은 '메인 · 10:00–20:00 · 연장 1시간'이다", () => {
    const [row] = payrollHistoryRows([
      normalDay({
        kind: "overtime",
        endsAt: "20:00",
        overtimeMinutes: 60,
      }),
    ]);

    expect(row.subtitle).toBe("메인 · 10:00–20:00 · 연장 1시간");
  });
});

describe("payrollHistoryRows — 연장에 분이 남으면 분까지 적는다", () => {
  it("초과분 90분은 '연장 1시간 30분'이다", () => {
    const [row] = payrollHistoryRows([
      normalDay({
        kind: "overtime",
        endsAt: "20:30",
        overtimeMinutes: 90,
      }),
    ]);

    expect(row.subtitle).toBe("메인 · 10:00–20:30 · 연장 1시간 30분");
  });
});

describe("payrollHistoryRows — 한 시간 미만 연장은 분만 적는다", () => {
  it("초과분 30분은 '연장 30분'이다", () => {
    const [row] = payrollHistoryRows([
      normalDay({
        kind: "overtime",
        endsAt: "19:30",
        overtimeMinutes: 30,
      }),
    ]);

    expect(row.subtitle).toBe("메인 · 10:00–19:30 · 연장 30분");
  });
});

describe("payrollHistoryRows — 교육 배정은 포지션 뒤에 '교육'이 붙는다", () => {
  it("'메인 교육 · 10:00–19:00'이고 연장 문구가 안 붙는다", () => {
    const [row] = payrollHistoryRows([normalDay({ isEducation: true })]);

    expect(row.subtitle).toBe("메인 교육 · 10:00–19:00");
  });
});

describe("payrollHistoryRows — 결근한 날은 금액이 –고 보조 정보가 '결근'이다", () => {
  it("결근이면 목록에서 안 빠지고 그 두 값으로 선다", () => {
    const [row] = payrollHistoryRows([
      normalDay({ kind: "absent", amount: 0 }),
    ]);

    expect(row.amountLabel).toBe("–");
    expect(row.subtitle).toBe("결근");
  });
});

describe("payrollHistoryRows — 시급 미정인 날은 금액이 –고 보조 정보에 '시급 미정'이 붙는다", () => {
  it("근무 시각은 그대로 있고 뒤에 '시급 미정'만 더 붙는다", () => {
    const [row] = payrollHistoryRows([
      normalDay({ kind: "wage-pending", amount: 0 }),
    ]);

    expect(row.amountLabel).toBe("–");
    expect(row.subtitle).toBe("메인 · 10:00–19:00 · 시급 미정");
  });
});

describe("payrollHistoryRows — 배정 없이 리허설만 있는 날도 줄이 선다", () => {
  it("포지션·근무 시각이 없어도 그 날짜가 목록에서 안 빠진다", () => {
    const rows = payrollHistoryRows([
      normalDay({
        date: "2026-10-08",
        amount: 24000,
        position: null,
        startsAt: null,
        endsAt: null,
      }),
    ]);

    const row = rows.find((entry) => entry.date === "2026-10-08");

    expect(row?.amountLabel).toBe("24,000원");
  });
});

describe("payrollHistoryRows — 최근이 위다", () => {
  it("날짜 순서와 무관하게 내림차순으로 정렬한다", () => {
    const rows = payrollHistoryRows([
      normalDay({ date: "2026-10-05" }),
      normalDay({ date: "2026-10-07" }),
      normalDay({ date: "2026-10-06" }),
    ]);

    expect(rows.map((row) => row.date)).toEqual([
      "2026-10-07",
      "2026-10-06",
      "2026-10-05",
    ]);
  });
});
