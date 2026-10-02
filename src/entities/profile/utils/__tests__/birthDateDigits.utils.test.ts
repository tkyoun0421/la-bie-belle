import {
  digitsOfBirthDate,
  isoDateOfDigits,
  spellBirthDate,
} from "@/entities/profile/utils/birthDateDigits.utils";

// 구현 대상: src/entities/profile/utils/birthDateDigits.utils.ts
//
// 생년월일이 사는 꼴이 셋이다 — DB의 `1993-04-21`, 칸의 `19930421`, 글의 「1993년 4월 21일」.
// 화면 둘이 이 셋 사이를 각자 손으로 오가고 있었다(`ProfileScreen`·`PendingScreen`).

describe("spellBirthDate — 여덟 자리를 말로 옮긴다", () => {
  it("앞자리 0을 안 읽는다", () => {
    expect(spellBirthDate("19930421")).toBe("1993년 4월 21일");
  });

  it("두 자리 달과 날도 그대로다", () => {
    expect(spellBirthDate("19901105")).toBe("1990년 11월 5일");
  });
});

describe("digitsOfBirthDate — DB 꼴을 칸 꼴로", () => {
  it("하이픈을 뺀다", () => {
    expect(digitsOfBirthDate("1993-04-21")).toBe("19930421");
  });

  it("값이 없으면 빈 칸이다", () => {
    expect(digitsOfBirthDate(null)).toBe("");
  });
});

describe("isoDateOfDigits — 칸 꼴을 DB 꼴로", () => {
  it("하이픈을 넣는다", () => {
    expect(isoDateOfDigits("19930421")).toBe("1993-04-21");
  });
});
