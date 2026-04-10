import { describe, expect, it } from "vitest";
import { parseReorderPositionsInput } from "#/mutations/positions/schemas/reorderPositions";

describe("parseReorderPositionsInput", () => {
  it("accepts an ordered list of ids", () => {
    expect(
      parseReorderPositionsInput({
        positionIds: [
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
        ],
      })
    ).toEqual({
      positionIds: [
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
      ],
    });
  });

  it("rejects duplicate ids", () => {
    expect(() =>
      parseReorderPositionsInput({
        positionIds: [
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        ],
      })
    ).toThrow("중복된 포지션이 포함되어 있습니다.");
  });
});
