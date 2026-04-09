import { describe, expect, it } from "vitest";
import { parseCreateEventTemplateInput } from "#/mutations/events/models/schemas/createEventTemplate";

describe("parseCreateEventTemplateInput", () => {
  it("normalizes valid template input", () => {
    const template = parseCreateEventTemplateInput({
      name: "  토요일 프리미엄 웨딩  ",
      firstServiceAt: "10:30",
      lastServiceEndAt: "16:00",
      slotDefaults: [
        {
          positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          requiredCount: 2,
          trainingCount: 1,
        },
      ],
    });

    expect(template.name).toBe("토요일 프리미엄 웨딩");
    expect(template.slotDefaults[0]?.positionId).toBe(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1"
    );
  });

  it("rejects duplicate positions in one template", () => {
    expect(() =>
      parseCreateEventTemplateInput({
        name: "중복 포지션 템플릿",
        firstServiceAt: "10:30",
        lastServiceEndAt: "16:00",
        slotDefaults: [
          {
            positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
            requiredCount: 2,
            trainingCount: 0,
          },
          {
            positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
            requiredCount: 1,
            trainingCount: 0,
          },
        ],
      })
    ).toThrow("같은 포지션");
  });
});
