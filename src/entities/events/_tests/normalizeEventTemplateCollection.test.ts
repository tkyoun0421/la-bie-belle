import { describe, expect, it } from "vitest";
import {
  sortEventTemplateCollection,
  upsertEventTemplateCollection,
} from "#/entities/events/models/normalizeEventTemplateCollection";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";

const baseTemplate = {
  firstServiceAt: "10:30",
  lastServiceEndAt: "16:00",
  slotDefaults: [
    {
      positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      positionName: "안내",
      requiredCount: 2,
      trainingCount: 0,
    },
  ],
  timeLabel: "10:30 - 16:00",
} satisfies Omit<EventTemplate, "createdAt" | "id" | "isPrimary" | "name">;

describe("upsertEventTemplateCollection", () => {
  it("demotes the previous representative template when a new one becomes representative", () => {
    const currentTemplates: EventTemplate[] = [
      {
        ...baseTemplate,
        createdAt: "2026-04-10T01:00:00.000Z",
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        isPrimary: true,
        name: "기존 대표 템플릿",
      },
      {
        ...baseTemplate,
        createdAt: "2026-04-10T02:00:00.000Z",
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
        isPrimary: false,
        name: "일반 템플릿",
      },
    ];

    const nextTemplates = upsertEventTemplateCollection(currentTemplates, {
      ...baseTemplate,
      createdAt: "2026-04-10T03:00:00.000Z",
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
      isPrimary: true,
      name: "일반 템플릿",
    });

    expect(nextTemplates[0]?.id).toBe("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2");
    expect(nextTemplates[0]?.isPrimary).toBe(true);
    expect(nextTemplates[1]?.id).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1");
    expect(nextTemplates[1]?.isPrimary).toBe(false);
  });
});

describe("sortEventTemplateCollection", () => {
  it("keeps the representative template first before createdAt ordering", () => {
    const nextTemplates = sortEventTemplateCollection([
      {
        ...baseTemplate,
        createdAt: "2026-04-10T02:00:00.000Z",
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
        isPrimary: false,
        name: "최근 템플릿",
      },
      {
        ...baseTemplate,
        createdAt: "2026-04-10T01:00:00.000Z",
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        isPrimary: true,
        name: "대표 템플릿",
      },
    ]);

    expect(nextTemplates[0]?.id).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1");
    expect(nextTemplates[1]?.id).toBe("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2");
  });
});
