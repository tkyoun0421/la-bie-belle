import {
  dayConfirmGate,
  allowsStructureChange,
} from "@/screens/scheduleAdmin/model/confirmGate.policy";

const CONFIRMED_AT = "2026-10-03T00:00:00Z";

describe("dayConfirmGate — 확정 전이면 before_confirm이다", () => {
  it("confirmedAt이 null이면 openedAt과 무관하게 before_confirm이다", () => {
    const gate = dayConfirmGate({
      openedAt: "2026-10-01T00:00:00Z",
      confirmedAt: null,
    });

    expect(gate).toBe("before_confirm");
  });
});

describe("dayConfirmGate — opened_at이 confirmed_at보다 이르면 확정 시점에 있던 날이다", () => {
  it("확정 훨씬 전에 연 날은 confirmed_original이다", () => {
    const gate = dayConfirmGate({
      openedAt: "2026-09-25T00:00:00Z",
      confirmedAt: CONFIRMED_AT,
    });

    expect(gate).toBe("confirmed_original");
  });
});

describe("dayConfirmGate — 같은 시각은 확정 시점 날이다(엄격 부등호)", () => {
  it("opened_at === confirmed_at이면 confirmed_original이다", () => {
    const gate = dayConfirmGate({
      openedAt: CONFIRMED_AT,
      confirmedAt: CONFIRMED_AT,
    });

    expect(gate).toBe("confirmed_original");
  });
});

describe("dayConfirmGate — opened_at이 confirmed_at보다 뒤면 새로 연 날이다", () => {
  it("확정 뒤 1초라도 늦게 연 날은 confirmed_reopened다", () => {
    const gate = dayConfirmGate({
      openedAt: "2026-10-03T00:00:01Z",
      confirmedAt: CONFIRMED_AT,
    });

    expect(gate).toBe("confirmed_reopened");
  });
});

describe("allowsStructureChange — 확정 시점 날만 구조 변경이 막힌다", () => {
  it("before_confirm은 구조를 고친다", () => {
    expect(allowsStructureChange("before_confirm")).toBe(true);
  });

  it("confirmed_reopened는 확정 전과 같이 구조를 고친다", () => {
    expect(allowsStructureChange("confirmed_reopened")).toBe(true);
  });

  it("confirmed_original은 자물쇠·끌기·자리 추가가 없다", () => {
    expect(allowsStructureChange("confirmed_original")).toBe(false);
  });
});
