import {
  toAdjustment,
  toExcuseStatus,
  toHoliday,
  toMemberWageRate,
  toWageRate,
} from "@/entities/payroll/utils/payroll.mapper";

describe("toWageRate — 시행일과 금액이 각자 제 필드로 간다", () => {
  it("effective_date가 effectiveDate로, amount가 그대로 간다", () => {
    const wageRate = toWageRate({
      effective_date: "2026-01-01",
      amount: 12000,
    });

    expect(wageRate.effectiveDate).toBe("2026-01-01");
    expect(wageRate.amount).toBe(12000);
  });
});

describe("toMemberWageRate — 사람과 기본값 추종 여부가 더해진다", () => {
  const ROW = {
    profile_id: "profile-1",
    effective_date: "2026-02-01",
    amount: 13000,
    follows_default: true,
  };

  it("profile_id가 profileId로, follows_default가 followsDefault로 간다", () => {
    const memberWageRate = toMemberWageRate(ROW);

    expect(memberWageRate.profileId).toBe("profile-1");
    expect(memberWageRate.followsDefault).toBe(true);
  });

  it("시행일과 금액도 함께 간다", () => {
    const memberWageRate = toMemberWageRate(ROW);

    expect(memberWageRate.effectiveDate).toBe("2026-02-01");
    expect(memberWageRate.amount).toBe(13000);
  });

  it("follows_default가 false면 그대로 false로 간다", () => {
    const memberWageRate = toMemberWageRate({ ...ROW, follows_default: false });

    expect(memberWageRate.followsDefault).toBe(false);
  });
});

describe("toAdjustment — 보정 분이 날짜·사람과 함께 간다", () => {
  const ROW = {
    id: "adj-1",
    day_id: "day-1",
    profile_id: "profile-1",
    minutes: -30,
    adjusted_at: "2026-02-10T09:00:00Z",
  };

  it("day_id와 profile_id가 섞이지 않고 각자 간다", () => {
    const adjustment = toAdjustment(ROW);

    expect(adjustment.dayId).toBe("day-1");
    expect(adjustment.profileId).toBe("profile-1");
  });

  it("id·minutes·adjusted_at이 그대로 간다", () => {
    const adjustment = toAdjustment(ROW);

    expect(adjustment.id).toBe("adj-1");
    expect(adjustment.minutes).toBe(-30);
    expect(adjustment.adjustedAt).toBe("2026-02-10T09:00:00Z");
  });
});

describe("toExcuseStatus — 제출·결정 때가 결정값과 함께 간다", () => {
  const ROW = {
    day_id: "day-1",
    profile_id: "profile-1",
    submitted_at: "2026-02-09T10:00:00Z",
    decided_at: null,
    decision: null,
  };

  it("submitted_at이 그대로 가고 decided_at·decision의 null이 유지된다", () => {
    const excuseStatus = toExcuseStatus(ROW);

    expect(excuseStatus.submittedAt).toBe("2026-02-09T10:00:00Z");
    expect(excuseStatus.decidedAt).toBeNull();
    expect(excuseStatus.decision).toBeNull();
  });

  it("decided_at과 decision에 값이 있으면 그 값이 그대로 간다", () => {
    const decided = toExcuseStatus({
      ...ROW,
      decided_at: "2026-02-10T00:00:00Z",
      decision: "approved",
    });

    expect(decided.decidedAt).toBe("2026-02-10T00:00:00Z");
    expect(decided.decision).toBe("approved");
  });

  it("day_id와 profile_id가 섞이지 않고 각자 간다", () => {
    const excuseStatus = toExcuseStatus(ROW);

    expect(excuseStatus.dayId).toBe("day-1");
    expect(excuseStatus.profileId).toBe("profile-1");
  });
});

describe("toHoliday — 날짜·출처·이름이 각자 제 필드로 간다", () => {
  const ROW = {
    holiday_date: "2026-03-01",
    source: "manual",
    name: "삼일절",
  };

  it("holiday_date가 holidayDate로 가고 source·name은 그대로 간다", () => {
    const holiday = toHoliday(ROW);

    expect(holiday.holidayDate).toBe("2026-03-01");
    expect(holiday.source).toBe("manual");
    expect(holiday.name).toBe("삼일절");
  });

  it("name이 null이면 null을 그대로 돌린다", () => {
    const holiday = toHoliday({ ...ROW, name: null });

    expect(holiday.name).toBeNull();
  });
});
