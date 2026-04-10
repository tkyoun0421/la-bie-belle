import { describe, expect, it, vi } from "vitest";
import { createPositionAction } from "#/mutations/positions/actions/createPosition";

describe("createPositionAction", () => {
  it("creates a position through the write repository", async () => {
    const client = {} as never;
    const requireActor = vi.fn().mockResolvedValue({
      email: null,
      kind: "development_bypass",
      source: "development_bypass",
      userId: null,
    });
    const createRecord = vi.fn().mockResolvedValue({
      allowedGender: "female",
      defaultRequiredCount: 3,
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
      name: "로비 대기 동선 안내",
      sortOrder: 5,
    });

    const result = await createPositionAction(
      {
        allowedGender: "female",
        defaultRequiredCount: 3,
        name: "  로비 대기 동선 안내  ",
      },
      { client, createRecord, requireActor }
    );

    expect(requireActor).toHaveBeenCalled();
    expect(createRecord).toHaveBeenCalledWith(
      {
        allowedGender: "female",
        defaultRequiredCount: 3,
        name: "로비 대기 동선 안내",
      },
      { client }
    );
    expect(result).toEqual({
      allowedGender: "female",
      defaultRequiredCount: 3,
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
      name: "로비 대기 동선 안내",
      sortOrder: 5,
    });
  });

  it("surfaces validation errors before hitting the repository", async () => {
    const createRecord = vi.fn();
    const requireActor = vi.fn();

    await expect(
      createPositionAction(
        {
          allowedGender: "all",
          defaultRequiredCount: 0,
          name: "안내 메인",
        },
        {
          client: {} as never,
          createRecord,
          requireActor,
        }
      )
    ).rejects.toThrow("기본 필수 인원");

    expect(requireActor).not.toHaveBeenCalled();
    expect(createRecord).not.toHaveBeenCalled();
  });
});
