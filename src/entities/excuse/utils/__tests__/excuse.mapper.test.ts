import { toExcuse } from "@/entities/excuse/utils/excuse.mapper";

describe("toExcuse — 사유와 결정이 섞이지 않는다", () => {
  const ROW = {
    id: "e1",
    day_id: "d1",
    profile_id: "p1",
    body: "몸이 아파요",
    submitted_at: "2026-10-01T09:00:00Z",
    decided_at: null,
    decision: null,
    decision_reason: null,
  };

  it("id·day_id·profile_id·body가 각자 제 필드로 간다", () => {
    const excuse = toExcuse(ROW);

    expect(excuse.id).toBe("e1");
    expect(excuse.dayId).toBe("d1");
    expect(excuse.profileId).toBe("p1");
    expect(excuse.body).toBe("몸이 아파요");
  });

  it("submitted_at이 그대로 가고 결정 셋은 null로 간다", () => {
    const excuse = toExcuse(ROW);

    expect(excuse.submittedAt).toBe("2026-10-01T09:00:00Z");
    expect(excuse.decidedAt).toBeNull();
    expect(excuse.decision).toBeNull();
    expect(excuse.decisionReason).toBeNull();
  });

  it("결정이 내려지면 decided_at·decision·decision_reason이 그 값으로 간다", () => {
    const decided = toExcuse({
      ...ROW,
      decided_at: "2026-10-02T00:00:00Z",
      decision: "rejected",
      decision_reason: "증빙 없음",
    });

    expect(decided.decidedAt).toBe("2026-10-02T00:00:00Z");
    expect(decided.decision).toBe("rejected");
    expect(decided.decisionReason).toBe("증빙 없음");
  });
});
