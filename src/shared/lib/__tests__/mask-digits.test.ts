import { describe, expect, it } from "vitest";

import { maskDigits } from "@/shared/lib/mask-digits";

describe("maskDigits", () => {
  it("숫자만 0으로 치환하고 쉼표·단위는 그대로 둔다", () => {
    expect(maskDigits("180,000원")).toBe("000,000원");
  });

  it("자릿수가 다른 값도 같은 자릿수로 치환한다", () => {
    expect(maskDigits("2,652,000원")).toBe("0,000,000원");
  });

  it("숫자가 없는 문자열은 그대로 반환한다", () => {
    expect(maskDigits("원")).toBe("원");
  });
});
