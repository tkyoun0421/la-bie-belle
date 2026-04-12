import { describe, expect, it, vi } from "vitest";
import {
  readEventById,
  readEvents,
} from "#/entities/events/repositories/readEventRepository";

describe("readEventRepository", () => {
  it("reads ordered event summaries for the dashboard", async () => {
    const thirdOrder = vi.fn().mockResolvedValue({
      data: [
        {
          event_date: "2026-04-20",
          first_service_at: "10:30:00",
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          status: "draft",
          time_label: "10:30 - 16:00",
          title: "4월 20일 주말 웨딩",
        },
        {
          event_date: "2026-04-21",
          first_service_at: "11:00:00",
          id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          status: "recruiting",
          time_label: "11:00 - 17:00",
          title: "4월 21일 연회 행사",
        },
      ],
      error: null,
    });
    const secondOrder = vi.fn().mockReturnValue({ order: thirdOrder });
    const firstOrder = vi.fn().mockReturnValue({ order: secondOrder });
    const select = vi.fn().mockReturnValue({ order: firstOrder });
    const from = vi.fn().mockReturnValue({ select });

    await expect(
      readEvents({
        client: { from } as never,
      })
    ).resolves.toEqual([
      {
        eventDate: "2026-04-20",
        firstServiceAt: "10:30",
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        status: "draft",
        timeLabel: "10:30 - 16:00",
        title: "4월 20일 주말 웨딩",
        viewerApplicationStatus: null,
      },
      {
        eventDate: "2026-04-21",
        firstServiceAt: "11:00",
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        status: "recruiting",
        timeLabel: "11:00 - 17:00",
        title: "4월 21일 연회 행사",
        viewerApplicationStatus: null,
      },
    ]);

    expect(firstOrder).toHaveBeenCalledWith("event_date", { ascending: true });
    expect(secondOrder).toHaveBeenCalledWith("first_service_at", {
      ascending: true,
    });
    expect(thirdOrder).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
  });

  it("reads an event detail with copied position slots", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        created_at: "2026-04-11T07:30:00.000000+00:00",
        event_date: "2026-04-20",
        event_position_slots: [
          {
            position_id: "11111111-1111-4111-8111-111111111111",
            positions: {
              id: "11111111-1111-4111-8111-111111111111",
              name: "안내",
              sort_order: 1,
            },
            required_count: 2,
            training_count: 0,
          },
        ],
        first_service_at: "10:30:00",
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        last_service_end_at: "16:00:00",
        status: "draft",
        template_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        time_label: "10:30 - 16:00",
        title: "4월 20일 주말 웨딩",
      },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    await expect(
      readEventById("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", {
        client: { from } as never,
      })
    ).resolves.toEqual({
      createdAt: "2026-04-11T07:30:00.000000+00:00",
      eventDate: "2026-04-20",
      firstServiceAt: "10:30",
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      lastServiceEndAt: "16:00",
      positionSlots: [
        {
          positionId: "11111111-1111-4111-8111-111111111111",
          positionName: "안내",
          requiredCount: 2,
          trainingCount: 0,
        },
      ],
      status: "draft",
      templateId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      timeLabel: "10:30 - 16:00",
      title: "4월 20일 주말 웨딩",
      viewerApplicationStatus: null,
    });

    expect(eq).toHaveBeenCalledWith(
      "id",
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
    );
  });

  it("returns null when the event does not exist", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    await expect(
      readEventById("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", {
        client: { from } as never,
      })
    ).resolves.toBeNull();
  });
});
