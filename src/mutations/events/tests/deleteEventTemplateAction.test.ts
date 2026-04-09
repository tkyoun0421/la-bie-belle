import { describe, expect, it, vi } from "vitest";
import { deleteEventTemplateAction } from "#/mutations/events/actions/deleteEventTemplate";

describe("deleteEventTemplateAction", () => {
  it("deletes a non-representative template and returns its id", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "99999999-9999-4999-8999-999999999999",
        is_primary: false,
      },
      error: null,
    });
    const targetSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle }),
    });
    const countSelect = vi.fn().mockResolvedValue({
      count: 2,
      error: null,
    });
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const deleteFn = vi.fn().mockReturnValue({ eq: deleteEq });
    const from = vi
      .fn()
      .mockReturnValueOnce({ select: targetSelect })
      .mockReturnValueOnce({ select: countSelect })
      .mockReturnValueOnce({ delete: deleteFn });

    await expect(
      deleteEventTemplateAction(
        { id: "99999999-9999-4999-8999-999999999999" },
        { client: { from } as never }
      )
    ).resolves.toBe("99999999-9999-4999-8999-999999999999");

    expect(deleteEq).toHaveBeenCalledWith(
      "id",
      "99999999-9999-4999-8999-999999999999"
    );
  });

  it("rejects deleting the representative template", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "99999999-9999-4999-8999-999999999999",
        is_primary: true,
      },
      error: null,
    });
    const targetSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle }),
    });
    const from = vi.fn().mockReturnValue({ select: targetSelect });

    await expect(
      deleteEventTemplateAction(
        { id: "99999999-9999-4999-8999-999999999999" },
        { client: { from } as never }
      )
    ).rejects.toThrow("대표 템플릿은 삭제할 수 없습니다.");
  });

  it("rejects deleting the last remaining template", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "99999999-9999-4999-8999-999999999999",
        is_primary: false,
      },
      error: null,
    });
    const targetSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle }),
    });
    const countSelect = vi.fn().mockResolvedValue({
      count: 1,
      error: null,
    });
    const from = vi
      .fn()
      .mockReturnValueOnce({ select: targetSelect })
      .mockReturnValueOnce({ select: countSelect });

    await expect(
      deleteEventTemplateAction(
        { id: "99999999-9999-4999-8999-999999999999" },
        { client: { from } as never }
      )
    ).rejects.toThrow("마지막 템플릿은 삭제할 수 없습니다.");
  });
});
