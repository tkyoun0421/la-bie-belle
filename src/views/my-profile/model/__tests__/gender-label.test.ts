import { describe, expect, it } from "vitest";

import { genderLabel } from "@/views/my-profile/model/gender-label";

describe("genderLabel", () => {
  it("male은 남성이다", () => {
    expect(genderLabel("male")).toBe("남성");
  });

  it("female은 여성이다", () => {
    expect(genderLabel("female")).toBe("여성");
  });
});
