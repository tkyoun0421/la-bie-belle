import { describe, expect, it } from "vitest";
import { mapPositionRow } from "#/queries/positions/models/mappers/mapPositionRow";

describe("mapPositionRow", () => {
  it("maps a position row into the domain model", () => {
    expect(
      mapPositionRow({
        allowed_gender: "all",
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        name: "안내 메인",
      })
    ).toEqual({
      allowedGender: "all",
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      name: "안내 메인",
    });
  });
});
