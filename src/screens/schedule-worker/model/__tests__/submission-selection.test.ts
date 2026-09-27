import { toggleSelectedDate } from "@/screens/schedule-worker/model/submission-selection";

describe("toggleSelectedDate — 날짜를 골랐다 무른다", () => {
  it("안 고른 날짜를 누르면 목록에 더해진다", () => {
    const next = toggleSelectedDate(["2026-10-10"], "2026-10-17");

    expect(next).toEqual(["2026-10-10", "2026-10-17"]);
  });

  it("이미 고른 날짜를 다시 누르면 목록에서 빠진다", () => {
    const next = toggleSelectedDate(["2026-10-10", "2026-10-17"], "2026-10-10");

    expect(next).toEqual(["2026-10-17"]);
  });

  it("마지막 하나를 빼면 빈 배열이 된다 — 0개도 유효한 선택이다", () => {
    const next = toggleSelectedDate(["2026-10-10"], "2026-10-10");

    expect(next).toEqual([]);
  });

  it("개수 상한이 없다 — 서른한 개를 골라도 전부 쌓인다", () => {
    const allDates = Array.from(
      { length: 31 },
      (_, index) => `2026-10-${String(index + 1).padStart(2, "0")}`,
    );

    const next = allDates.reduce(
      (selected, date) => toggleSelectedDate(selected, date),
      [] as string[],
    );

    expect(next).toHaveLength(31);
  });

  it("원본 배열을 바꾸지 않는다", () => {
    const original = ["2026-10-10"];

    toggleSelectedDate(original, "2026-10-17");

    expect(original).toEqual(["2026-10-10"]);
  });
});
