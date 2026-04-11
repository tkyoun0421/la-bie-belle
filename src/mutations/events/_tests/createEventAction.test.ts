import { describe, expect, it, vi } from "vitest";
import { eventErrorCodes } from "#/entities/events/models/errors/eventError";
import { createEventAction } from "#/mutations/events/actions/createEvent";

describe("createEventAction", () => {
  it("creates an event record and returns the created event detail", async () => {
    const client = {} as never;
    const requireActor = vi.fn().mockResolvedValue({
      email: null,
      kind: "development_bypass",
      source: "development_bypass",
      userId: null,
    });
    const createRecord = vi
      .fn()
      .mockResolvedValue("99999999-9999-4999-8999-999999999999");
    const readById = vi.fn().mockResolvedValue({
      createdAt: "2026-04-11T08:00:00.000Z",
      eventDate: "2026-04-20",
      firstServiceAt: "10:30",
      id: "99999999-9999-4999-8999-999999999999",
      lastServiceEndAt: "16:00",
      positionSlots: [
        {
          positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          positionName: "안내",
          requiredCount: 2,
          trainingCount: 0,
        },
      ],
      status: "draft",
      templateId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      timeLabel: "10:30 - 16:00",
      title: "4월 20일 주말 웨딩",
    });

    const event = await createEventAction(
      {
        eventDate: "2026-04-20",
        templateId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        title: "4월 20일 주말 웨딩",
      },
      {
        client,
        createRecord,
        readById,
        requireActor,
      }
    );

    expect(requireActor).toHaveBeenCalled();
    expect(createRecord).toHaveBeenCalledWith(
      {
        createdBy: null,
        eventDate: "2026-04-20",
        templateId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        title: "4월 20일 주말 웨딩",
      },
      { client }
    );
    expect(readById).toHaveBeenCalledWith(
      "99999999-9999-4999-8999-999999999999",
      { client }
    );
    expect(event.id).toBe("99999999-9999-4999-8999-999999999999");
  });

  it("rejects malformed payloads before hitting the repository", async () => {
    const createRecord = vi.fn();
    const requireActor = vi.fn();

    await expect(
      createEventAction(
        {
          eventDate: "2026/04/20",
          templateId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          title: "주말 웨딩",
        },
        {
          client: {} as never,
          createRecord,
          requireActor,
        }
      )
    ).rejects.toThrow("날짜");

    expect(requireActor).not.toHaveBeenCalled();
    expect(createRecord).not.toHaveBeenCalled();
  });

  it("fails with a stable code when the created event cannot be reloaded", async () => {
    await expect(
      createEventAction(
        {
          eventDate: "2026-04-20",
          templateId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          title: "주말 웨딩",
        },
        {
          client: {} as never,
          createRecord: vi
            .fn()
            .mockResolvedValue("99999999-9999-4999-8999-999999999999"),
          readById: vi.fn().mockResolvedValue(null),
          requireActor: vi.fn().mockResolvedValue({
            email: null,
            kind: "development_bypass",
            source: "development_bypass",
            userId: null,
          }),
        }
      )
    ).rejects.toMatchObject({
      code: eventErrorCodes.createResultMissing,
    });
  });
});
