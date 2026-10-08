import { showRevertOption } from "@/screens/scheduleAdmin/model/adjustChoiceState.policy";

describe("showRevertOption — 조정 행이 없으면 원래대로가 안 선다", () => {
  it("빈 배열이면 false다", () => {
    expect(showRevertOption([])).toBe(false);
  });
});

describe("showRevertOption — 조정 행이 하나라도 있으면 원래대로가 선다", () => {
  it("결근이 든 행 하나만 있어도 true다", () => {
    expect(showRevertOption([{ minutes: -540 }])).toBe(true);
  });

  it("마지막 행이 0분이어도(이미 되돌린 사람이어도) true다", () => {
    expect(showRevertOption([{ minutes: -540 }, { minutes: 0 }])).toBe(true);
  });
});
