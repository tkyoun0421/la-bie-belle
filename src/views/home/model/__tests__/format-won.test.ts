import { describe, expect, it } from "vitest";

import { formatWon } from "@/views/home/model/format-won";

describe("formatWon — MaskedAmount의 format 프롭, ui에서 못 쓰는 toLocaleString을 대신한다", () => {
  it("천 단위 콤마를 찍고 원을 붙인다", () => {
    expect(formatWon(960000)).toBe("960,000원");
  });

  it("백만 단위도 콤마를 반복해서 찍는다", () => {
    expect(formatWon(3744000)).toBe("3,744,000원");
  });

  it("천 단위 미만은 콤마 없이 원만 붙인다", () => {
    expect(formatWon(500)).toBe("500원");
  });

  it("0원도 그대로 표기한다", () => {
    expect(formatWon(0)).toBe("0원");
  });

  it("views/pay/ui/PayView.tsx:34의 formatAmount와 같은 문자열을 낸다 — 두 화면 표기가 어긋나면 안 된다", () => {
    const amount = 132000;

    expect(formatWon(amount)).toBe(`${amount.toLocaleString("ko-KR")}원`);
  });
});
