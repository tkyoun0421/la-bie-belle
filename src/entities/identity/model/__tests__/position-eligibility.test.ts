import { describe, expect, it } from "vitest";

import { matchesGenderRequirement } from "@/entities/identity/model/position-eligibility";

describe("matchesGenderRequirement", () => {
  it("성별 조건이 any면 성별과 무관하게 통과한다", () => {
    expect(matchesGenderRequirement("any", "male")).toBe(true);
    expect(matchesGenderRequirement("any", "female")).toBe(true);
  });

  it("성별 조건이 male이면 남성 근무자만 통과한다", () => {
    expect(matchesGenderRequirement("male", "male")).toBe(true);
    expect(matchesGenderRequirement("male", "female")).toBe(false);
  });

  it("성별 조건이 female이면 여성 근무자만 통과한다", () => {
    expect(matchesGenderRequirement("female", "female")).toBe(true);
    expect(matchesGenderRequirement("female", "male")).toBe(false);
  });
});
