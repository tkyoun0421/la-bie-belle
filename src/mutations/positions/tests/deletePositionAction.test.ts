import { describe, expect, it, vi } from "vitest";
import { deletePositionAction } from "#/mutations/positions/actions/deletePosition";

describe("deletePositionAction", () => {
  it("deletes a position and returns its id", async () => {
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
      deletePositionAction(
        { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1" },
        { client: { from } as never }
      )
    ).resolves.toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1");
  });

  it("surfaces an in-use error when the position is referenced", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: {
        code: "23503",
      },
    });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const eq = vi.fn().mockReturnValue({ select });
    const deleteFn = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ delete: deleteFn });

    await expect(
      deletePositionAction(
        { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1" },
        { client: { from } as never }
      )
    ).rejects.toThrow(
      "템플릿이나 행사에서 사용 중인 포지션은 삭제할 수 없습니다."
    );
  });
});
