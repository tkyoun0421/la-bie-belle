import { describe, expect, it } from "vitest";

import { resolveEffectiveWage } from "@/entities/identity/model/wage";

describe("resolveEffectiveWage", () => {
  it("hourlyWage가 설정돼 있으면 저장값을 그대로 쓰고 파생이 아니다", () => {
    expect(resolveEffectiveWage(15000, 12000)).toEqual({ amount: 15000, isDerived: false });
  });

  it("hourlyWage가 null이면 기본 시급으로 대체하고 파생임을 표시한다", () => {
    expect(resolveEffectiveWage(null, 12000)).toEqual({ amount: 12000, isDerived: true });
  });
});
