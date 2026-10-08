import { spellWon } from "@/shared/utils/spellNumber";

describe("spellWon — 세 자리마다 쉼표를 찍고 「원」을 붙인다", () => {
  it("108000은 '108,000원'이다", () => {
    expect(spellWon(108000)).toBe("108,000원");
  });

  it("백만 단위도 쉼표가 두 번 찍힌다 — '1,296,000원'", () => {
    expect(spellWon(1296000)).toBe("1,296,000원");
  });

  it("네 자리 미만은 쉼표 없이 '500원'이다", () => {
    expect(spellWon(500)).toBe("500원");
  });
});

describe("spellWon — 0원은 계산이 끝난 값이라 '0원'으로 적는다", () => {
  it("0을 넣으면 '0원'이다 — 값이 없는 자리(NO_VALUE)와 다른 자리다", () => {
    expect(spellWon(0)).toBe("0원");
  });
});
