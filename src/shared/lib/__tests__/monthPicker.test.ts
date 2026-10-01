// 구현 대상: src/shared/lib/monthPicker.ts
//
// 달 고르기 시트(MonthPickerSheet)의 순수 계산이다 — 연도 이동과 12칸 만들기
// (docs/2-design/modules/schedule/screens/schedule-worker.md 「달 고르기 시트 짜임」).
// 연도 줄은 화살표로 해를 오가고, 월 12칸은 4열 3행으로 「1월」부터 「12월」까지 서며 지금
// 보고 있는 달이 선택 상태다.

import { buildYearMonths, shiftYear } from "@/shared/lib/monthPicker";

describe("shiftYear — 연도 이동에 열람 제한이 없다", () => {
  it("한 해 앞으로 간다", () => {
    expect(shiftYear(2026, 1)).toBe(2027);
  });

  it("한 해 뒤로 간다", () => {
    expect(shiftYear(2026, -1)).toBe(2025);
  });
});

describe("buildYearMonths — 그 해의 12칸을 1월부터 12월까지 만든다", () => {
  it("month 키가 그 해의 01부터 12까지 순서대로 선다", () => {
    const cells = buildYearMonths(2026, "2026-10");

    expect(cells.map((cell) => cell.month)).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
      "2026-11",
      "2026-12",
    ]);
  });

  it("칸 라벨이 「1월」부터 「12월」까지다", () => {
    const cells = buildYearMonths(2026, "2026-10");

    expect(cells[0]!.label).toBe("1월");
    expect(cells[11]!.label).toBe("12월");
  });
});

describe("buildYearMonths — 지금 보고 있는 달만 선택 상태다", () => {
  it("selectedMonth와 같은 칸만 selected가 참이다", () => {
    const cells = buildYearMonths(2026, "2026-10");

    const selected = cells.filter((cell) => cell.selected);

    expect(selected).toHaveLength(1);
    expect(selected[0]!.month).toBe("2026-10");
  });

  it("selectedMonth가 다른 해면 어느 칸도 선택되지 않는다", () => {
    const cells = buildYearMonths(2026, "2027-01");

    expect(cells.every((cell) => !cell.selected)).toBe(true);
  });
});
