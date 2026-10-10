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

const { spellDuration } = await import("@/shared/utils/spellNumber");

describe("spellDuration — 0분인 자리만 시간으로 적는다(결근한 줄처럼 시간이 실제로 없는 자리)", () => {
  it("0분은 '0시간'이다", () => {
    expect(spellDuration(0)).toBe("0시간");
  });
});

describe("spellDuration — 한 시간이 안 되면 분만 적는다", () => {
  it("30분은 '30분'이다 — '0시간 30분'으로 쓰지 않는다", () => {
    expect(spellDuration(30)).toBe("30분");
  });

  it("59분은 '59분'이다", () => {
    expect(spellDuration(59)).toBe("59분");
  });
});

describe("spellDuration — 딱 떨어지는 시간은 시간만 적는다", () => {
  it("60분은 '1시간'이다", () => {
    expect(spellDuration(60)).toBe("1시간");
  });

  it("120분은 '2시간'이다", () => {
    expect(spellDuration(120)).toBe("2시간");
  });

  it("540분은 '9시간'이다", () => {
    expect(spellDuration(540)).toBe("9시간");
  });
});

describe("spellDuration — 분이 남으면 시간과 분을 이어 적는다", () => {
  it("90분은 '1시간 30분'이다", () => {
    expect(spellDuration(90)).toBe("1시간 30분");
  });
});
