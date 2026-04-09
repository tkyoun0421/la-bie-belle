import { describe, expect, it } from "vitest";
import { parseUpdatePositionInput } from "#/mutations/positions/schemas/updatePosition";

describe("parseUpdatePositionInput", () => {
  it("normalizes a valid update payload", () => {
    expect(
      parseUpdatePositionInput({
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        allowedGender: "male",
        name: "  폐백 진행  ",
      })
    ).toEqual({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      allowedGender: "male",
      name: "폐백 진행",
    });
  });
});
