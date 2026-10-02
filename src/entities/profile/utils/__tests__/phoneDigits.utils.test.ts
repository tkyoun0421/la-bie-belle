import {
  digitsOnly,
  hyphenatePhone,
} from "@/entities/profile/utils/phoneDigits.utils";

// 구현 대상: src/entities/profile/utils/phoneDigits.utils.ts
//
// 같은 손 둘이 화면 셋에 복제돼 있었다(`ProfileScreen`·`ContactSheet`·`PendingScreen`).
// 칸은 숫자만 받고 하이픈은 앱이 넣는다 — 굳은 글과 서버가 보는 꼴이 같다.

describe("digitsOnly — 숫자만 남기고 자리에서 끊는다", () => {
  it("숫자가 아닌 것을 버린다", () => {
    expect(digitsOnly("010-1234-5678", 11)).toBe("01012345678");
  });

  it("자리를 넘으면 끊는다", () => {
    expect(digitsOnly("0101234567899", 11)).toBe("01012345678");
  });

  it("생년월일은 여덟 자리다", () => {
    expect(digitsOnly("1993.04.21", 8)).toBe("19930421");
  });

  it("빈 글은 빈 글이다", () => {
    expect(digitsOnly("", 11)).toBe("");
  });
});

describe("hyphenatePhone — 세 토막으로 끊어 넣는다", () => {
  it("열한 자리를 끊는다", () => {
    expect(hyphenatePhone("01012345678")).toBe("010-1234-5678");
  });

  it("여덟 자리가 안 되면 그대로 둔다", () => {
    expect(hyphenatePhone("0101234")).toBe("0101234");
  });

  it("빈 글은 빈 글이다", () => {
    expect(hyphenatePhone("")).toBe("");
  });
});
