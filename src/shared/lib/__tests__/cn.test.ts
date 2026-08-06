import { describe, expect, it } from "vitest";

import { cn } from "@/shared/lib/cn";

describe("cn", () => {
  it("여러 클래스명을 하나의 문자열로 합친다", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("falsy 값을 무시한다", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("충돌하는 tailwind 클래스는 나중 값이 이긴다", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("조건부 객체 문법을 지원한다", () => {
    expect(cn("a", { b: true, c: false })).toBe("a b");
  });
});
