import { describe, expect, it } from "vitest";
import { parseUpdateEventTemplateInput } from "#/mutations/events/schemas/updateEventTemplate";

describe("parseUpdateEventTemplateInput", () => {
  it("normalizes a valid update payload", () => {
    expect(
      parseUpdateEventTemplateInput({
        id: "99999999-9999-4999-8999-999999999999",
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
      })
    ).toEqual({
      id: "99999999-9999-4999-8999-999999999999",
      name: "토요일 프리미엄 웨딩",
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
  });
});
