import type { OpenSlot } from "@/entities/schedule/model/schedule.type";
import {
  countOpenSlotsByDate,
  summarizeOpenSlots,
} from "@/entities/schedule/utils/groupOpenSlots.utils";

function row(workDate: string, positions: string[] = ["스캔"]): OpenSlot {
  return {
    slotId: `slot-${workDate}-${positions.join("-")}-${Math.random()}`,
    dayId: `day-${workDate}`,
    workDate,
    positions,
  };
}

describe("countOpenSlotsByDate — 날짜별로 빈 자리 행 수를 센다", () => {
  it("같은 날짜의 행이 여럿이면 그 수로 묶인다", () => {
    const counts = countOpenSlotsByDate([
      row("2026-10-10"),
      row("2026-10-10"),
      row("2026-10-11"),
    ]);

    expect(counts).toEqual({ "2026-10-10": 2, "2026-10-11": 1 });
  });

  it("빈 배열이면 빈 객체다", () => {
    expect(countOpenSlotsByDate([])).toEqual({});
  });
});

describe("summarizeOpenSlots — 넷까지는 그대로, 넘치면 「외 n개」로 센다", () => {
  it("넷 이하면 전부 목록에 서고 넘침이 없다", () => {
    const rows = [
      row("2026-10-10", ["스캔"]),
      row("2026-10-11", ["팀장"]),
      row("2026-10-12", ["메인"]),
    ];

    const summary = summarizeOpenSlots(rows);

    expect(summary.totalCount).toBe(3);
    expect(summary.items).toEqual([
      { workDate: "2026-10-10", position: "스캔" },
      { workDate: "2026-10-11", position: "팀장" },
      { workDate: "2026-10-12", position: "메인" },
    ]);
    expect(summary.overflowCount).toBe(0);
  });

  it("여섯 개면 넷만 서고 「외 2개」로 넘친다", () => {
    const rows = [
      row("2026-10-10"),
      row("2026-10-11"),
      row("2026-10-12"),
      row("2026-10-13"),
      row("2026-10-14"),
      row("2026-10-15"),
    ];

    const summary = summarizeOpenSlots(rows);

    expect(summary.totalCount).toBe(6);
    expect(summary.items).toHaveLength(4);
    expect(summary.overflowCount).toBe(2);
  });

  it("겸임 자리는 포지션 이름을 이어 붙인다", () => {
    const summary = summarizeOpenSlots([row("2026-10-10", ["메인", "드레스"])]);

    expect(summary.items[0]).toEqual({
      workDate: "2026-10-10",
      position: "메인·드레스",
    });
  });

  it("빈 배열이면 목록도 넘침도 없다", () => {
    const summary = summarizeOpenSlots([]);

    expect(summary.totalCount).toBe(0);
    expect(summary.items).toEqual([]);
    expect(summary.overflowCount).toBe(0);
  });
});
