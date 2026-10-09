const { spellHours, adjustRowLabel } =
  await import("@/features/adjustment/utils/spellHours.utils");

describe("spellHours — 분을 시간과 분으로 읽는다", () => {
  it("딱 떨어지면 시간만 적는다", () => {
    expect(spellHours(540)).toBe("9시간");
  });

  it("한 시간이 안 되면 분만 적는다", () => {
    expect(spellHours(45)).toBe("45분");
  });

  it("둘 다 있으면 시간과 분을 이어 적는다", () => {
    expect(spellHours(585)).toBe("9시간 45분");
  });

  it("0분은 0시간이다", () => {
    expect(spellHours(0)).toBe("0시간");
  });
});

describe("adjustRowLabel — 이름과 최종 시간을 읽어주고 앞머리가 있으면 끼운다", () => {
  it("조정이 없으면 이름과 시간만 읽는다", () => {
    expect(
      adjustRowLabel({
        profileId: "p1",
        name: "박서연",
        finalMinutes: 540,
        adjustmentKind: null,
        rehearsalLine: null,
      }),
    ).toBe("박서연 · 9시간");
  });

  it("결근이면 앞머리가 시간 앞에 선다", () => {
    expect(
      adjustRowLabel({
        profileId: "p2",
        name: "김지우",
        finalMinutes: 0,
        adjustmentKind: "결근",
        rehearsalLine: null,
      }),
    ).toBe("김지우 · 결근 0시간");
  });
});
