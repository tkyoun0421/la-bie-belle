import { adjustRowLabel } from "@/features/adjustment/utils/spellHours.utils";

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

  it("한 시간이 안 되면 분만 적는다 — 「0시간 30분」으로 쓰지 않는다", () => {
    expect(
      adjustRowLabel({
        profileId: "p3",
        name: "이하늘",
        finalMinutes: 30,
        adjustmentKind: null,
        rehearsalLine: null,
      }),
    ).toBe("이하늘 · 30분");
  });
});
