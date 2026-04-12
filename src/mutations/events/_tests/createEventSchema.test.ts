import { describe, expect, it } from "vitest";
import { parseCreateEventInput } from "#/mutations/events/schemas/createEvent";

describe("parseCreateEventInput", () => {
  it("normalizes valid event create input", () => {
    const event = parseCreateEventInput({
      eventDate: "2026-04-20",
      templateId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      title: "  4월 20일 주말 웨딩  ",
    });

    expect(event).toEqual({
      eventDate: "2026-04-20",
      templateId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      title: "4월 20일 주말 웨딩",
    });
  });

  it("rejects malformed event dates", () => {
    expect(() =>
      parseCreateEventInput({
        eventDate: "2026/04/20",
        templateId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        title: "주말 웨딩",
      })
    ).toThrow("날짜");
  });
});
