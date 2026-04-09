import { describe, expect, it } from "vitest";
import { mapEventTemplateRow } from "#/queries/events/models/mappers/mapEventTemplateRow";

describe("mapEventTemplateRow", () => {
  it("maps nested slot rows into the event template model", () => {
    const template = mapEventTemplateRow({
      id: "99999999-9999-4999-8999-999999999999",
      name: "주요 예식 예배",
      time_label: "10:30 - 16:00",
      first_service_at: "10:30:00",
      last_service_end_at: "16:00:00",
      created_at: "2026-04-10T01:00:00.000Z",
      event_template_position_slots: [
        {
          position_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          required_count: 2,
          training_count: 1,
          positions: {
            id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
            name: "안내 메인",
          },
        },
      ],
    });

    expect(template.firstServiceAt).toBe("10:30");
    expect(template.slotDefaults[0]).toEqual({
      positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      positionName: "안내 메인",
      requiredCount: 2,
      trainingCount: 1,
    });
  });
});
