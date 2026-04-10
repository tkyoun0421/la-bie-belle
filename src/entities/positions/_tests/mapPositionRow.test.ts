import { describe, expect, it } from "vitest";
import { mapPositionRow } from "#/entities/positions/models/mappers/mapPositionRow";

describe("mapPositionRow", () => {
  it("maps position rows into validated positions", () => {
    const position = mapPositionRow({
      allowed_gender: "female",
      default_required_count: 3,
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "안내",
      sort_order: 2,
    });

    expect(position.allowedGender).toBe("female");
    expect(position.defaultRequiredCount).toBe(3);
    expect(position.name).toBe("안내");
    expect(position.sortOrder).toBe(2);
  });
});
