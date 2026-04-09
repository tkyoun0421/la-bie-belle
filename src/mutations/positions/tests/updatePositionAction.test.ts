import { describe, expect, it, vi } from "vitest";
import { updatePositionAction } from "#/mutations/positions/actions/updatePosition";

describe("updatePositionAction", () => {
  it("updates a position and returns the saved row", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        name: "폐백 진행",
        allowed_gender: "male",
      },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ single });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });

    const result = await updatePositionAction(
      {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        allowedGender: "male",
        name: "  폐백 진행  ",
      },
      { client: { from } as never }
    );

    expect(update).toHaveBeenCalledWith({
      allowed_gender: "male",
      name: "폐백 진행",
    });
    expect(eq).toHaveBeenCalledWith(
      "id",
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1"
    );
    expect(result).toEqual({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      name: "폐백 진행",
      allowedGender: "male",
    });
  });
});
