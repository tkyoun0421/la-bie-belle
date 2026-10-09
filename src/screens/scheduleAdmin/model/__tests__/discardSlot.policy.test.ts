import {
  discardSlotJudgement,
  discardSlotWarningLine,
  type DiscardSlotAssignment,
} from "@/screens/scheduleAdmin/model/discardSlot.policy";

function live(): DiscardSlotAssignment {
  return { endedAt: null };
}

function ended(): DiscardSlotAssignment {
  return { endedAt: "2026-10-09T00:00:00Z" };
}

describe("discardSlotJudgement — 살아 있는 정규 배정이 없으면 바로 지운다", () => {
  it("배정이 하나도 없으면 removes_immediately다", () => {
    expect(discardSlotJudgement([])).toBe("removes_immediately");
  });

  it("남은 배정이 전부 닫혀 있으면 removes_immediately다", () => {
    expect(discardSlotJudgement([ended()])).toBe("removes_immediately");
  });
});

describe("discardSlotJudgement — 살아 있는 배정이 있으면 확인 시트가 선다", () => {
  it("살아 있는 배정이 하나면 needs_confirmation이다", () => {
    expect(discardSlotJudgement([live()])).toBe("needs_confirmation");
  });

  it("닫힌 것과 살아 있는 것이 섞여 있어도 needs_confirmation이다", () => {
    expect(discardSlotJudgement([ended(), live()])).toBe("needs_confirmation");
  });
});

describe("discardSlotWarningLine — 「{이름} 님 배정도 같이 사라져요」다", () => {
  it("이름을 그 자리에 넣는다", () => {
    expect(discardSlotWarningLine("박서연")).toBe(
      "박서연 님 배정도 같이 사라져요",
    );
  });
});
