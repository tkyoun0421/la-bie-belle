import { describe, expect, it } from "vitest";
import { mapEventDetailRow } from "#/entities/events/models/mappers/mapEventRow";

describe("mapEventDetailRow", () => {
  it("maps event detail rows into the validated event detail shape", () => {
    const event = mapEventDetailRow({
      created_at: "2026-04-11T07:30:00.000000+00:00",
      event_date: "2026-04-20",
      event_position_slots: [
        {
          position_id: "22222222-2222-4222-8222-222222222222",
          positions: {
            id: "22222222-2222-4222-8222-222222222222",
            name: "연회장 안내",
            sort_order: 2,
          },
          required_count: 3,
          training_count: 1,
        },
        {
          position_id: "11111111-1111-4111-8111-111111111111",
          positions: {
            id: "11111111-1111-4111-8111-111111111111",
            name: "버진로드 세팅",
            sort_order: 1,
          },
          required_count: 1,
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
    });

    expect(event).toEqual({
      createdAt: "2026-04-11T07:30:00.000000+00:00",
      eventDate: "2026-04-20",
      firstServiceAt: "10:30",
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      lastServiceEndAt: "16:00",
      positionSlots: [
        {
          positionId: "11111111-1111-4111-8111-111111111111",
          positionName: "버진로드 세팅",
          requiredCount: 1,
          trainingCount: 0,
        },
        {
          positionId: "22222222-2222-4222-8222-222222222222",
          positionName: "연회장 안내",
          requiredCount: 3,
          trainingCount: 1,
        },
      ],
      status: "draft",
      templateId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      timeLabel: "10:30 - 16:00",
      title: "4월 20일 주말 웨딩",
      viewerApplicationStatus: null,
    });
  });
});
