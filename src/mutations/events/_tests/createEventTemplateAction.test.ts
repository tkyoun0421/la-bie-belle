import { describe, expect, it, vi } from "vitest";
import { createEventTemplateAction } from "#/mutations/events/actions/createEventTemplate";

describe("createEventTemplateAction", () => {
  it("creates a template record and returns the created template", async () => {
    const client = {} as never;
    const createRecord = vi
      .fn()
      .mockResolvedValue("99999999-9999-4999-8999-999999999999");
    const readById = vi.fn().mockResolvedValue({
      id: "99999999-9999-4999-8999-999999999999",
      name: "주요 프리미엄 웨딩",
      isPrimary: true,
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

    const template = await createEventTemplateAction(
      {
        name: "주요 프리미엄 웨딩",
        isPrimary: true,
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
        createRecord,
        readById,
      }
    );

    expect(createRecord).toHaveBeenCalledWith(
      {
        createdBy: null,
        firstServiceAt: "10:30",
        isPrimary: true,
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

  it("rejects invalid service time before hitting the repository", async () => {
    const createRecord = vi.fn();

    await expect(
      createEventTemplateAction(
        {
          name: "잘못된 템플릿",
          firstServiceAt: "16:00",
          lastServiceEndAt: "10:30",
          slotDefaults: [
            {
              positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
              requiredCount: 1,
            },
          ],
        },
        {
          client: {} as never,
          createRecord,
        }
      )
    ).rejects.toThrow("마지막 서비스 종료 시간");

    expect(createRecord).not.toHaveBeenCalled();
  });
});
