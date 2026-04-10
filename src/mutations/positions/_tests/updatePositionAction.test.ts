import { describe, expect, it, vi } from "vitest";
import { updatePositionAction } from "#/mutations/positions/actions/updatePosition";

describe("updatePositionAction", () => {
  it("updates a position through the write repository", async () => {
    const client = {} as never;
    const updateRecord = vi.fn().mockResolvedValue({
      allowedGender: "male",
      defaultRequiredCount: 4,
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      name: "설명과 진행",
      sortOrder: 2,
    });

    const result = await updatePositionAction(
      {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        allowedGender: "male",
        defaultRequiredCount: 4,
        name: "  설명과 진행  ",
      },
      { client, updateRecord }
    );

    expect(updateRecord).toHaveBeenCalledWith(
      {
        allowedGender: "male",
        defaultRequiredCount: 4,
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        name: "설명과 진행",
      },
      { client }
    );
    expect(result).toEqual({
      allowedGender: "male",
      defaultRequiredCount: 4,
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      name: "설명과 진행",
      sortOrder: 2,
    });
  });
});
