// 구현 대상: src/screens/scheduleAdmin/model/discardSlot.ts
//
// 자리를 버리는 손짓의 데이터 판정이다(schedule-admin.md 「잠금과 구조 변경」 — 「빈
// 자리는 놓는 순간 사라지고, 사람이 든 자리는 시트가 확인한다」). 살아 있는 정규 배정이
// 있는 자리만 확인 시트를 띄운다 — 좌표가 아니라 그 자리의 배정 상태만 본다. 문구는
// 「날 상세 문안」의 「배정 있는 자리 버릴 때」 표 그대로다.

import {
  discardSlotJudgement,
  discardSlotWarningLine,
  type DiscardSlotAssignment,
} from "@/screens/scheduleAdmin/model/discardSlot";

function live(): DiscardSlotAssignment {
  return { ended_at: null };
}

function ended(): DiscardSlotAssignment {
  return { ended_at: "2026-10-09T00:00:00Z" };
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
