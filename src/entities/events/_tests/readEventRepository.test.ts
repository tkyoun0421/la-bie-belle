import { describe, expect, it, vi } from "vitest";
import { readEventById } from "#/entities/events/repositories/readEventRepository";

describe("readEventRepository", () => {
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
