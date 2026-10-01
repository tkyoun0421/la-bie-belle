import {
  miniCalendarGrid,
  miniCalendarWeekCount,
} from "@/shared/lib/mini-calendar";

describe("miniCalendarWeekCount — 달마다 다섯 줄이나 여섯 줄이다 (AC-05, 경계)", () => {
  it("2026년 9월은 다섯 줄이다", () => {
    expect(miniCalendarWeekCount(2026, 9)).toBe(5);
  });

  it("2026년 3월은 여섯 줄이다 — 1일이 늦은 요일이고 31일까지 있다", () => {
    expect(miniCalendarWeekCount(2026, 3)).toBe(6);
  });
});

describe("miniCalendarGrid — 월요일 시작, 이 달 밖 칸은 빈칸이다 (AC-05)", () => {
  it("모든 줄이 일곱 칸이다", () => {
    const grid = miniCalendarGrid(2026, 9);

    expect(grid).toHaveLength(5);
    for (const week of grid) {
      expect(week).toHaveLength(7);
    }
  });

  it("2026년 9월 1일(화요일)은 월요일 칸이 아니라 둘째 칸에 선다", () => {
    const grid = miniCalendarGrid(2026, 9);

    expect(grid[0]).toEqual([null, 1, 2, 3, 4, 5, 6]);
  });

  it("2026년 9월 마지막 줄은 30일 뒤로 빈칸이 이어진다", () => {
    const grid = miniCalendarGrid(2026, 9);

    expect(grid.at(-1)).toEqual([28, 29, 30, null, null, null, null]);
  });

  it("2026년 3월 1일(일요일)은 여섯 번째 칸에 선다 — 여섯 줄이 필요하다", () => {
    const grid = miniCalendarGrid(2026, 3);

    expect(grid).toHaveLength(6);
    expect(grid[0]).toEqual([null, null, null, null, null, null, 1]);
    expect(grid.at(-1)).toEqual([30, 31, null, null, null, null, null]);
  });
});
