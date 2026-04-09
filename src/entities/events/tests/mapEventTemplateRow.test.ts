import { describe, expect, it } from "vitest";
import { mapEventTemplateRow } from "#/entities/events/models/mappers/mapEventTemplateRow";

describe("mapEventTemplateRow", () => {
  it("maps event template rows with UTC offset timestamps into validated templates", () => {
    const template = mapEventTemplateRow({
      created_at: "2026-04-09T20:37:14.657861+00:00",
      event_template_position_slots: [
        {
          position_id: "11111111-1111-4111-8111-111111111111",
          positions: {
            id: "11111111-1111-4111-8111-111111111111",
            name: "안내",
          },
          required_count: 2,
          training_count: 1,
        },
      ],
      first_service_at: "10:30:00",
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      last_service_end_at: "16:00:00",
      name: "주요 웨딩",
      time_label: "10:30 - 16:00",
    });

    expect(template.createdAt).toBe("2026-04-09T20:37:14.657861+00:00");
    expect(template.slotDefaults[0]?.positionName).toBe("안내");
    expect(template.firstServiceAt).toBe("10:30");
    expect(template.lastServiceEndAt).toBe("16:00");
  });
});
