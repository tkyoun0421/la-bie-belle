import { describe, expect, it, vi } from "vitest";
import { deletePositionAction } from "#/mutations/positions/actions/deletePosition";

describe("deletePositionAction", () => {
  it("deletes a position through the write repository", async () => {
    const client = {} as never;
    const requireActor = vi.fn().mockResolvedValue({
      email: null,
      kind: "development_bypass",
      source: "development_bypass",
      userId: null,
    });
    const deleteRecord = vi
      .fn()
      .mockResolvedValue("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1");

    await expect(
      deletePositionAction(
        { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1" },
        { client, deleteRecord, requireActor }
      )
    ).resolves.toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1");

    expect(requireActor).toHaveBeenCalled();
    expect(deleteRecord).toHaveBeenCalledWith(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      { client }
    );
  });
});
