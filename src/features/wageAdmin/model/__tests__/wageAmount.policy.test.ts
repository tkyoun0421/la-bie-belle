import {
  canSaveWage,
  formatAmountDisplay,
  nextAmountDigits,
} from "@/features/wageAdmin/model/wageAmount.policy";

describe("nextAmountDigits — 상한 100,000원을 넘는 타이핑은 안 들어간다", () => {
  it("100,000원까지의 입력은 그대로 받는다", () => {
    expect(nextAmountDigits("10000", "100000")).toBe("100000");
  });

  it("100,001원이 되는 입력은 반영되지 않고 이전 값이 그대로 남는다", () => {
    expect(nextAmountDigits("10000", "100001")).toBe("10000");
  });

  it("자릿수 오타로 상한을 크게 넘겨도 이전 값이 그대로 남는다", () => {
    expect(nextAmountDigits("50000", "500009")).toBe("50000");
  });
});

describe("canSaveWage — 지금 값과 같거나 빈 칸이거나 0이면 저장 불가다", () => {
  it("빈 칸이면 저장할 수 없다", () => {
    expect(canSaveWage("", 11000)).toBe(false);
  });

  it("0이면 저장할 수 없다 — 최저임금은 안 본다", () => {
    expect(canSaveWage("0", 11000)).toBe(false);
  });

  it("지금 값과 같으면 저장할 수 없다", () => {
    expect(canSaveWage("11000", 11000)).toBe(false);
  });

  it("지금 값과 다르고 0보다 크면 저장할 수 있다", () => {
    expect(canSaveWage("12000", 11000)).toBe(true);
  });

  it("지금 값이 없던 사람(null)이 값을 넣으면 저장할 수 있다", () => {
    expect(canSaveWage("12000", null)).toBe(true);
  });
});

describe("formatAmountDisplay — 세 자리마다 쉼표를 찍는다", () => {
  it("100000은 100,000으로 찍힌다", () => {
    expect(formatAmountDisplay("100000")).toBe("100,000");
  });

  it("1000은 1,000으로 찍힌다", () => {
    expect(formatAmountDisplay("1000")).toBe("1,000");
  });

  it("빈 칸은 빈 칸 그대로다", () => {
    expect(formatAmountDisplay("")).toBe("");
  });
});
