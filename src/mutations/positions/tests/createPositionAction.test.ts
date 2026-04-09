import { describe, expect, it, vi } from "vitest";
import { createPositionAction } from "#/mutations/positions/actions/createPosition";

describe("createPositionAction", () => {
  it("inserts a position and returns the created row", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        allowed_gender: "female",
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
        name: "신부 대기실 안내",
      },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });

    const result = await createPositionAction(
      { allowedGender: "female", name: "  신부 대기실 안내  " },
      { client: { from } as never }
    );

    expect(from).toHaveBeenCalledWith("positions");
    expect(insert).toHaveBeenCalledWith({
      allowed_gender: "female",
      name: "신부 대기실 안내",
    });
    expect(result).toEqual({
      allowedGender: "female",
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
      name: "신부 대기실 안내",
    });
  });

  it("surfaces a duplicate-name error", async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: {
        code: "23505",
      },
    });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });

    await expect(
      createPositionAction(
        { allowedGender: "all", name: "예도 메인" },
        { client: { from } as never }
      )
    ).rejects.toThrow("같은 이름의 포지션이 이미 있습니다.");
  });
});
