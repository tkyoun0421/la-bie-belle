import { POSITION_ORDER } from "@/entities/schedule/consts/schedule.const";
import type { ScheduleSlot } from "@/entities/schedule/model/schedule.type";
import {
  groupSlotsByPosition,
  slotFillCount,
  assignmentForSlot,
  type PositionAssignment,
} from "@/screens/scheduleAdmin/utils/positionRows.utils";

function slot(
  id: string,
  positions: string[],
  endedAt: string | null = null,
): ScheduleSlot {
  return { id, positions, endedAt };
}

function assignment(
  id: string,
  slotId: string | null,
  kind: string,
  endedAt: string | null = null,
): PositionAssignment {
  return { id, slotId, kind, endedAt };
}

describe("POSITION_ORDER — README SCH-011의 아홉 순서 그대로다", () => {
  it("팀장부터 대기실까지 아홉이 그 순서다", () => {
    expect(POSITION_ORDER).toEqual([
      "팀장",
      "스캔",
      "메인",
      "드레스",
      "축가",
      "매니저",
      "안내",
      "드레스실",
      "대기실",
    ]);
  });
});

describe("groupSlotsByPosition — 아홉 줄로 자리를 가른다", () => {
  it("아홉 포지션 키가 슬롯이 없어도 전부 선다", () => {
    const groups = groupSlotsByPosition([]);

    expect(Object.keys(groups).sort()).toEqual([...POSITION_ORDER].sort());
    expect(groups["팀장"]).toEqual([]);
  });

  it("슬롯은 그 포지션 줄에만 들어간다", () => {
    const groups = groupSlotsByPosition([
      slot("slot-안내-1", ["안내"]),
      slot("slot-스캔-1", ["스캔"]),
    ]);

    expect(groups["안내"].map((s) => s.id)).toEqual(["slot-안내-1"]);
    expect(groups["스캔"].map((s) => s.id)).toEqual(["slot-스캔-1"]);
    expect(groups["팀장"]).toEqual([]);
  });

  it("닫힌 자리는 어느 줄에도 안 선다", () => {
    const groups = groupSlotsByPosition([
      slot("slot-안내-ended", ["안내"], "2026-10-09T00:00:00Z"),
    ]);

    expect(groups["안내"]).toEqual([]);
  });

  it("겸임 자리는 받은 쪽(positions[0]) 줄에만 선다", () => {
    const groups = groupSlotsByPosition([
      slot("slot-겸임", ["메인", "드레스"]),
    ]);

    expect(groups["메인"].map((s) => s.id)).toEqual(["slot-겸임"]);
    expect(groups["드레스"]).toEqual([]);
  });
});

describe("slotFillCount — 분자는 살아 있는 정규 배정이 있는 자리 수, 분모는 살아 있는 자리 수다", () => {
  it("정규 배정이 있는 자리만 분자에 든다", () => {
    const slots = [slot("slot-1", ["스캔"]), slot("slot-2", ["스캔"])];
    const assignments = [assignment("a-1", "slot-1", "regular")];

    expect(slotFillCount(slots, assignments)).toEqual({
      filled: 1,
      total: 2,
    });
  });

  it("교육 배정은 분자에 안 든다", () => {
    const slots = [slot("slot-1", ["스캔"])];
    const assignments = [assignment("a-1", null, "training")];

    expect(slotFillCount(slots, assignments)).toEqual({
      filled: 0,
      total: 1,
    });
  });

  it("닫힌(endedAt 있는) 배정은 그 자리를 다시 빈 자리로 센다", () => {
    const slots = [slot("slot-1", ["스캔"])];
    const assignments = [
      assignment("a-1", "slot-1", "regular", "2026-10-09T00:00:00Z"),
    ];

    expect(slotFillCount(slots, assignments)).toEqual({
      filled: 0,
      total: 1,
    });
  });

  it("자리가 없으면 0/0이다", () => {
    expect(slotFillCount([], [])).toEqual({ filled: 0, total: 0 });
  });
});

describe("slotFillCount — 겸임 합침으로 내준 쪽은 분모가 준다", () => {
  it("내준 쪽 줄에는 자리가 하나도 안 남는다", () => {
    const donorGroup: ScheduleSlot[] = [];

    expect(slotFillCount(donorGroup, [])).toEqual({ filled: 0, total: 0 });
  });
});

describe("assignmentForSlot — 배정은 slotId로 그 카드에만 앉는다", () => {
  it("같은 포지션의 다른 자리에 있는 배정은 안 온다", () => {
    const assignments = [
      assignment("a-1", "slot-1", "regular"),
      assignment("a-2", "slot-2", "regular"),
    ];

    expect(assignmentForSlot("slot-2", assignments)?.id).toBe("a-2");
    expect(assignmentForSlot("slot-1", assignments)?.id).toBe("a-1");
  });

  it("살아 있는 정규 배정이 없으면 null이다", () => {
    const assignments = [
      assignment("a-1", "slot-1", "regular", "2026-10-09T00:00:00Z"),
    ];

    expect(assignmentForSlot("slot-1", assignments)).toBeNull();
  });

  it("교육 배정은 slotId가 없어 어느 카드에도 안 앉는다", () => {
    const assignments = [assignment("a-1", null, "training")];

    expect(assignmentForSlot("slot-1", assignments)).toBeNull();
  });
});
