import { spellTotal } from "@/entities/rehearsal/utils/spellTotal.utils";

describe("spellTotal — 0건이면 자리가 빈다", () => {
  it("count가 0이면 빈 문자열이다", () => {
    expect(spellTotal({ count: 0, minutes: 0 })).toBe("");
  });
});

describe("spellTotal — 「N건 · N시간」꼴이다", () => {
  it("3건 300분이면 「3건 · 5시간」이다", () => {
    expect(spellTotal({ count: 3, minutes: 300 })).toBe("3건 · 5시간");
  });
});

describe("spellTotal — 분이 60 배수가 아니면 분까지 적는다", () => {
  it("1건 90분이면 「1건 · 1시간 30분」이다", () => {
    expect(spellTotal({ count: 1, minutes: 90 })).toBe("1건 · 1시간 30분");
  });
});

describe("spellTotal — 0분인 자리만 시간으로 적는다(결근한 줄처럼 시간이 실제로 없는 자리)", () => {
  it("1건 0분이면 「1건 · 0시간」이다 — 「1건 · 0분」으로 쓰지 않는다", () => {
    expect(spellTotal({ count: 1, minutes: 0 })).toBe("1건 · 0시간");
  });
});

describe("spellTotal — 한 시간이 안 되면 분만 적는다", () => {
  it("1건 30분이면 「1건 · 30분」이다 — 「1건 · 0시간 30분」으로 쓰지 않는다", () => {
    expect(spellTotal({ count: 1, minutes: 30 })).toBe("1건 · 30분");
  });
});
