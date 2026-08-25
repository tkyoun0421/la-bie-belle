import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("공백으로 클래스를 잇는다", () => {
    expect(cn("flex", "items-center")).toBe("flex items-center");
  });

  it("거짓 값을 걸러낸다", () => {
    expect(cn("flex", false, undefined, "gap-2")).toBe("flex gap-2");
  });

  it("충돌하는 tailwind 클래스는 뒤가 이긴다", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
