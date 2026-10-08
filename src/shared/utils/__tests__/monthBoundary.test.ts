import {
  canGoToPreviousMonth,
  canGoToNextMonth,
} from "@/shared/utils/monthBoundary";

describe("canGoToPreviousMonth — 첫 근무표가 있는 달과 같으면 뒤로 화살표가 사라진다", () => {
  it("첫 근무표 달 2025-11-01이 든 2025-11은 false다", () => {
    expect(canGoToPreviousMonth("2025-11", "2025-11-01")).toBe(false);
  });
});

describe("canGoToPreviousMonth — 첫 근무표가 있는 달보다 나중이면 뒤로 화살표가 산다", () => {
  it("첫 근무표 달의 다음 달은 true다", () => {
    expect(canGoToPreviousMonth("2025-12", "2025-11-01")).toBe(true);
  });
});

describe("canGoToPreviousMonth — 첫 근무표가 있는 달보다 이전 달은 없다고 봐도 화살표가 안 산다", () => {
  it("이론상 그보다 이른 달이 와도 false다", () => {
    expect(canGoToPreviousMonth("2025-10", "2025-11-01")).toBe(false);
  });
});

describe("canGoToPreviousMonth — firstScheduleMonth의 일(day)은 안 본다, 달만 본다", () => {
  it("같은 달이면 일자가 달라도(01이 아니어도) false다", () => {
    expect(canGoToPreviousMonth("2025-11", "2025-11-01")).toBe(false);
  });
});

describe("canGoToNextMonth — 이번 달과 같으면 앞으로 화살표가 사라진다", () => {
  it("오늘 2026-09-15가 든 2026-09는 false다", () => {
    expect(canGoToNextMonth("2026-09", "2026-09-15")).toBe(false);
  });
});

describe("canGoToNextMonth — 이번 달보다 이전 달은 앞으로 화살표가 산다", () => {
  it("이번 달의 이전 달은 true다", () => {
    expect(canGoToNextMonth("2026-08", "2026-09-15")).toBe(true);
  });
});
