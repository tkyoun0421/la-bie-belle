import { describe, expect, it } from "vitest";
import { mapEventTemplateRow } from "#/entities/events/models/mappers/mapEventTemplateRow";

describe("mapEventTemplateRow", () => {
  it("uses the position default required count when there is no override", () => {
    const template = mapEventTemplateRow({
      created_at: "2026-04-09T20:37:14.657861+00:00",
      event_template_position_slots: [
        {
          position_id: "11111111-1111-4111-8111-111111111111",
          positions: {
            default_required_count: 3,
            id: "11111111-1111-4111-8111-111111111111",
            name: "안내",
          },
          required_count_override: null,
          training_count: 1,
        },
      ],
      first_service_at: "10:30:00",
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      is_primary: true,
      last_service_end_at: "16:00:00",
      name: "주말 웨딩",
      time_label: "10:30 - 16:00",
    });

    expect(template.createdAt).toBe("2026-04-09T20:37:14.657861+00:00");
    expect(template.firstServiceAt).toBe("10:30");
    expect(template.isPrimary).toBe(true);
    expect(template.lastServiceEndAt).toBe("16:00");
    expect(template.slotDefaults[0]?.positionName).toBe("안내");
    expect(template.slotDefaults[0]?.requiredCount).toBe(3);
  });

  it("prefers the stored override when the template sets a custom required count", () => {
    const template = mapEventTemplateRow({
      created_at: "2026-04-09T20:37:14.657861+00:00",
      event_template_position_slots: [
        {
          position_id: "11111111-1111-4111-8111-111111111111",
          positions: {
            default_required_count: 3,
            id: "11111111-1111-4111-8111-111111111111",
            name: "안내",
          },
          required_count_override: 1,
          training_count: 0,
        },
      ],
      first_service_at: "10:30:00",
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      is_primary: false,
      last_service_end_at: "16:00:00",
      name: "주말 웨딩",
      time_label: "10:30 - 16:00",
    });

    expect(template.isPrimary).toBe(false);
    expect(template.slotDefaults[0]?.requiredCount).toBe(1);
  });
});
