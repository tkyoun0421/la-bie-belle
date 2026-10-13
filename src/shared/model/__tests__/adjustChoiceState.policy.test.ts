import {
  showRevertOption,
  nextMinuteDigits,
  extraMinutes,
} from "@/shared/model/adjustChoiceState.policy";

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

describe("nextMinuteDigits — 숫자가 아닌 글자는 걸러낸다", () => {
  it("숫자만 남긴다", () => {
    expect(nextMinuteDigits("1a2 분")).toBe("12");
  });

  it("숫자가 없으면 빈 글자다", () => {
    expect(nextMinuteDigits("분")).toBe("");
  });
});

describe("extraMinutes — 입력한 글자를 연장 분으로 바꾼다", () => {
  it("숫자 글자는 그 분이다", () => {
    expect(extraMinutes("30")).toBe(30);
  });

  it("빈 글자는 null이다", () => {
    expect(extraMinutes("")).toBeNull();
  });

  it("0은 null이다", () => {
    expect(extraMinutes("0")).toBeNull();
  });
});
