import { spellGender } from "@/entities/profile/utils/spellGender.utils";

// 구현 대상: src/entities/profile/utils/spellGender.utils.ts
//
// 저장된 성별을 글로 세운다(login.md 「굳은 글 성별」). 네 화면이 같은 글자를 쓰고, 값이
// 안 든 사람은 빈 글이다 — 아직 안 보낸 사람과 비워진 사람이 그 자리다(ACC-010).

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
