import { describe, expect, it } from "vitest";

import { CONFIRMED_ROSTER } from "@/entities/schedule/model/assignment.mock";

describe("assignment mock", () => {
  it("본인 행과 교육생 행을 구분해 제공한다", () => {
    expect(CONFIRMED_ROSTER.some((row) => row.isMe)).toBe(true);
    expect(CONFIRMED_ROSTER.some((row) => row.isTrainee)).toBe(true);
  });

  it("본인 행은 하나뿐이다", () => {
    expect(CONFIRMED_ROSTER.filter((row) => row.isMe)).toHaveLength(1);
  });
});
