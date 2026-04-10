import { describe, expect, it, vi } from "vitest";
import {
  createPositionRecord,
  deletePositionRecord,
  reorderPositionRecords,
  updatePositionRecord,
} from "#/entities/positions/repositories/writePositionRepository";

describe("writePositionRepository", () => {
  it("creates a position through the insert contract", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        allowed_gender: "female",
        default_required_count: 3,
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
        name: "로비 대기 동선 안내",
        sort_order: 5,
      },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });

    await expect(
      createPositionRecord(
        {
          allowedGender: "female",
          defaultRequiredCount: 3,
          name: "로비 대기 동선 안내",
        },
        { client: { from } as never }
      )
    ).resolves.toEqual({
      allowedGender: "female",
      defaultRequiredCount: 3,
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
      name: "로비 대기 동선 안내",
      sortOrder: 5,
    });

    expect(insert).toHaveBeenCalledWith({
      allowed_gender: "female",
      default_required_count: 3,
      name: "로비 대기 동선 안내",
    });
  });

  it("updates a position through the update contract", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        allowed_gender: "male",
        default_required_count: 4,
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        name: "설명과 진행",
        sort_order: 2,
      },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ single });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });

    await expect(
      updatePositionRecord(
        {
          allowedGender: "male",
          defaultRequiredCount: 4,
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          name: "설명과 진행",
        },
        { client: { from } as never }
      )
    ).resolves.toEqual({
      allowedGender: "male",
      defaultRequiredCount: 4,
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      name: "설명과 진행",
      sortOrder: 2,
    });

    expect(eq).toHaveBeenCalledWith(
      "id",
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1"
    );
  });

  it("deletes a position through the delete contract", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const eq = vi.fn().mockReturnValue({ select });
    const deleteFn = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ delete: deleteFn });

    await expect(
      deletePositionRecord("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1", {
        client: { from } as never,
      })
    ).resolves.toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1");
  });

  it("reorders positions through the rpc contract", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });

    await expect(
      reorderPositionRecords(
        [
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        ],
        { client: { rpc } as never }
      )
    ).resolves.toEqual([
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    ]);

    expect(rpc).toHaveBeenCalledWith("reorder_positions", {
      p_position_ids: [
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      ],
    });
  });
});
