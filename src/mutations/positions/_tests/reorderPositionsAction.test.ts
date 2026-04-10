import { describe, expect, it, vi } from "vitest";
import { reorderPositionsAction } from "#/mutations/positions/actions/reorderPositions";

describe("reorderPositionsAction", () => {
  it("delegates the reorder request to the write repository", async () => {
    const client = {} as never;
    const requireActor = vi.fn().mockResolvedValue({
      email: null,
      kind: "development_bypass",
      source: "development_bypass",
      userId: null,
    });
    const reorderRecords = vi.fn().mockResolvedValue([
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    ]);

    const result = await reorderPositionsAction(
      {
        positionIds: [
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        ],
      },
      { client, reorderRecords, requireActor }
    );

    expect(requireActor).toHaveBeenCalled();
    expect(reorderRecords).toHaveBeenCalledWith(
      [
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      ],
      { client }
    );
    expect(result).toEqual([
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    ]);
  });
});
