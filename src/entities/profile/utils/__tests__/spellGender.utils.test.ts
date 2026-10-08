import { spellGender } from "@/entities/profile/utils/spellGender.utils";

describe("spellGender — 저장 값을 읽는 글로 옮긴다", () => {
  it("female은 여성이다", () => {
    expect(spellGender("female")).toBe("여성");
  });

  it("male은 남성이다", () => {
    expect(spellGender("male")).toBe("남성");
  });
});

describe("spellGender — 성별이 아닌 값은 빈 글이다", () => {
  it("비어 있으면 빈 글이다", () => {
    expect(spellGender(null)).toBe("");
  });

  it("둘 중 하나가 아닌 글자가 와도 빈 글이다", () => {
    expect(spellGender("other")).toBe("");
  });
});
