import { describe, expect, it, vi } from "vitest";
import { updateEventTemplateAction } from "#/mutations/events/actions/updateEventTemplate";

describe("updateEventTemplateAction", () => {
  it("updates a template record and returns the updated template", async () => {
    const client = {} as never;
    const requireActor = vi.fn().mockResolvedValue({
      email: null,
      kind: "development_bypass",
      source: "development_bypass",
      userId: null,
    });
    const updateRecord = vi
      .fn()
      .mockResolvedValue("99999999-9999-4999-8999-999999999999");
    const readById = vi.fn().mockResolvedValue({
      id: "99999999-9999-4999-8999-999999999999",
      name: "주요 프리미엄 웨딩",
      isPrimary: false,
      timeLabel: "10:30 - 16:00",
      firstServiceAt: "10:30",
      lastServiceEndAt: "16:00",
      createdAt: "2026-04-10T01:00:00.000Z",
      slotDefaults: [
        {
          positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          positionName: "안내 메인",
          requiredCount: 2,
          trainingCount: 0,
        },
      ],
    });

    const template = await updateEventTemplateAction(
      {
        id: "99999999-9999-4999-8999-999999999999",
        name: "주요 프리미엄 웨딩",
        isPrimary: false,
        firstServiceAt: "10:30",
        lastServiceEndAt: "16:00",
        slotDefaults: [
          {
            positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
            requiredCount: 2,
          },
        ],
      },
      {
        client,
        readById,
        requireActor,
        updateRecord,
      }
    );

    expect(requireActor).toHaveBeenCalled();
    expect(updateRecord).toHaveBeenCalledWith(
      {
        firstServiceAt: "10:30",
        id: "99999999-9999-4999-8999-999999999999",
        isPrimary: false,
        lastServiceEndAt: "16:00",
        name: "주요 프리미엄 웨딩",
        slotDefaults: [
          {
            positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
            requiredCount: 2,
            trainingCount: 0,
          },
        ],
      },
      { client }
    );
    expect(readById).toHaveBeenCalledWith(
      "99999999-9999-4999-8999-999999999999",
      { client }
    );
    expect(template.name).toBe("주요 프리미엄 웨딩");
  });
});
