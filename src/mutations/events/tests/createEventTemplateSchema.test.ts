import { describe, expect, it } from "vitest";
import { parseCreateEventTemplateInput } from "#/mutations/events/schemas/createEventTemplate";

describe("parseCreateEventTemplateInput", () => {
  it("normalizes valid template input", () => {
    const template = parseCreateEventTemplateInput({
      name: "  주요 프리미엄 웨딩  ",
      isPrimary: true,
      firstServiceAt: "10:30",
      lastServiceEndAt: "16:00",
      slotDefaults: [
        {
          positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          requiredCount: 2,
        },
      ],
    });

    expect(template.name).toBe("주요 프리미엄 웨딩");
    expect(template.isPrimary).toBe(true);
    expect(template.slotDefaults[0]?.positionId).toBe(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1"
    );
    expect(template.slotDefaults[0]?.trainingCount).toBe(0);
  });

  it("defaults the primary flag to false when omitted", () => {
    const template = parseCreateEventTemplateInput({
      name: "서브 템플릿",
      firstServiceAt: "10:30",
      lastServiceEndAt: "16:00",
      slotDefaults: [
        {
          positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          requiredCount: 2,
        },
      ],
    });

    expect(template.isPrimary).toBe(false);
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
          },
          {
            positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
            requiredCount: 1,
          },
        ],
      })
    ).toThrow("같은 포지션");
  });
});
