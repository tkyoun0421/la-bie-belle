import { describe, expect, it, vi } from "vitest";
import { deleteEventTemplateAction } from "#/mutations/events/actions/deleteEventTemplate";

describe("deleteEventTemplateAction", () => {
  it("deletes a non-representative template and returns its id", async () => {
    const client = {} as never;
    const requireActor = vi.fn().mockResolvedValue({
      email: null,
      kind: "development_bypass",
      source: "development_bypass",
      userId: null,
    });
    const readDeleteSnapshot = vi.fn().mockResolvedValue({
      id: "99999999-9999-4999-8999-999999999999",
      isPrimary: false,
    });
    const countRecords = vi.fn().mockResolvedValue(2);
    const deleteRecord = vi.fn().mockResolvedValue(undefined);

    await expect(
      deleteEventTemplateAction(
        { id: "99999999-9999-4999-8999-999999999999" },
        {
          client,
          countRecords,
          deleteRecord,
          readDeleteSnapshot,
          requireActor,
        }
      )
    ).resolves.toBe("99999999-9999-4999-8999-999999999999");

    expect(requireActor).toHaveBeenCalled();
    expect(readDeleteSnapshot).toHaveBeenCalledWith(
      "99999999-9999-4999-8999-999999999999",
      { client }
    );
    expect(countRecords).toHaveBeenCalledWith({ client });
    expect(deleteRecord).toHaveBeenCalledWith(
      "99999999-9999-4999-8999-999999999999",
      { client }
    );
  });

  it("rejects deleting the representative template", async () => {
    const deleteRecord = vi.fn();

    await expect(
      deleteEventTemplateAction(
        { id: "99999999-9999-4999-8999-999999999999" },
        {
          client: {} as never,
          countRecords: vi.fn().mockResolvedValue(2),
          deleteRecord,
          readDeleteSnapshot: vi.fn().mockResolvedValue({
            id: "99999999-9999-4999-8999-999999999999",
            isPrimary: true,
          }),
          requireActor: vi.fn().mockResolvedValue({
            email: null,
            kind: "development_bypass",
            source: "development_bypass",
            userId: null,
          }),
        }
      )
    ).rejects.toThrow("대표 템플릿은 삭제할 수 없습니다.");

    expect(deleteRecord).not.toHaveBeenCalled();
  });

  it("rejects deleting the last remaining template", async () => {
    const deleteRecord = vi.fn();

    await expect(
      deleteEventTemplateAction(
        { id: "99999999-9999-4999-8999-999999999999" },
        {
          client: {} as never,
          countRecords: vi.fn().mockResolvedValue(1),
          deleteRecord,
          readDeleteSnapshot: vi.fn().mockResolvedValue({
            id: "99999999-9999-4999-8999-999999999999",
            isPrimary: false,
          }),
          requireActor: vi.fn().mockResolvedValue({
            email: null,
            kind: "development_bypass",
            source: "development_bypass",
            userId: null,
          }),
        }
      )
    ).rejects.toThrow("마지막 템플릿은 삭제할 수 없습니다.");

    expect(deleteRecord).not.toHaveBeenCalled();
  });
});
