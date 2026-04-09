import { describe, expect, it, vi } from "vitest";
import { deleteEventTemplateAction } from "#/mutations/events/actions/deleteEventTemplate";

describe("deleteEventTemplateAction", () => {
  it("deletes an event template and returns its id", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "99999999-9999-4999-8999-999999999999",
      },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const eq = vi.fn().mockReturnValue({ select });
    const deleteFn = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ delete: deleteFn });

    await expect(
      deleteEventTemplateAction(
        { id: "99999999-9999-4999-8999-999999999999" },
        { client: { from } as never }
      )
    ).resolves.toBe("99999999-9999-4999-8999-999999999999");
  });
});
