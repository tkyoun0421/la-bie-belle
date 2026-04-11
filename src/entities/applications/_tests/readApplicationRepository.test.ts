import { describe, expect, it, vi } from "vitest";
import {
  readApplicationStatusByEventId,
  readApplicationStatusesByEventIds,
} from "#/entities/applications/repositories/readApplicationRepository";

describe("readApplicationRepository", () => {
  it("reads application statuses keyed by event id", async () => {
    const inFn = vi.fn().mockResolvedValue({
      data: [
        {
          event_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          status: "applied",
        },
        {
          event_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          status: "cancelled",
        },
      ],
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ in: inFn });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    await expect(
      readApplicationStatusesByEventIds(
        "33333333-3333-4333-8333-333333333333",
        [
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        ],
        { client: { from } as never }
      )
    ).resolves.toEqual({
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa": "applied",
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb": "cancelled",
    });
  });

  it("reads a single application status for one event", async () => {
    const inFn = vi.fn().mockResolvedValue({
      data: [
        {
          event_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          status: "applied",
        },
      ],
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ in: inFn });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    await expect(
      readApplicationStatusByEventId(
        "33333333-3333-4333-8333-333333333333",
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        { client: { from } as never }
      )
    ).resolves.toBe("applied");
  });
});
