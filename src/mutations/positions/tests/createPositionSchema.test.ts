import { describe, expect, it } from "vitest";
import { parseCreatePositionInput } from "#/mutations/positions/models/schemas/createPosition";

describe("parseCreatePositionInput", () => {
  it("trims a valid position name", () => {
    expect(
      parseCreatePositionInput({
        allowedGender: "all",
        name: "  예도 메인  ",
      })
    ).toEqual({
      allowedGender: "all",
      name: "예도 메인",
    });
  });

  it("rejects an empty position name", () => {
    expect(() =>
      parseCreatePositionInput({
        allowedGender: "all",
        name: "   ",
      })
    ).toThrow("포지션 이름을 입력해 주세요.");
  });
});
