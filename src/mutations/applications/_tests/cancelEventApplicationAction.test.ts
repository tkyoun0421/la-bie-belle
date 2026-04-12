import { describe, expect, it, vi } from "vitest";
import { cancelEventApplicationAction } from "#/mutations/applications/actions/cancelEventApplication";

describe("cancelEventApplicationAction", () => {
  it("cancels an existing application for the current actor", async () => {
    const client = {} as never;
    const requireActor = vi.fn().mockResolvedValue({
      email: "member1@labiebelle.local",
      kind: "development_member",
      name: "팀원1",
      role: "member",
      source: "development_seed",
      userId: "33333333-3333-4333-8333-333333333333",
    });
    const readEvent = vi.fn().mockResolvedValue({
      createdAt: "2026-04-11T08:00:00.000Z",
      eventDate: "2026-04-20",
      firstServiceAt: "10:30",
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      lastServiceEndAt: "16:00",
      positionSlots: [],
      status: "draft",
      templateId: null,
      timeLabel: "10:30 - 16:00",
      title: "4월 20일 주말 웨딩",
      viewerApplicationStatus: "applied",
    });
    const cancelRecord = vi.fn().mockResolvedValue(undefined);

    await expect(
      cancelEventApplicationAction(
        {
          eventId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        },
        {
          cancelRecord,
          client,
          readEvent,
          requireActor,
        }
      )
    ).resolves.toEqual({
      eventId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      status: "cancelled",
    });

    expect(cancelRecord).toHaveBeenCalledWith(
      {
        eventId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        userId: "33333333-3333-4333-8333-333333333333",
      },
      { client }
    );
  });
});
