import { describe, expect, it, vi } from "vitest";
import { reorderPositionsAction } from "#/mutations/positions/actions/reorderPositions";

describe("reorderPositionsAction", () => {
  it("calls rpc with the ordered ids", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });

    const result = await reorderPositionsAction(
      {
        positionIds: [
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        ],
      },
      { client: { rpc } as never }
    );

    expect(rpc).toHaveBeenCalledWith("reorder_positions", {
      p_position_ids: [
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      ],
    });
    expect(result).toEqual([
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    ]);
  });
});
