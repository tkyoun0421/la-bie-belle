import { describe, expect, it, vi } from "vitest";
import {
  applyToEventRecord,
  cancelEventApplicationRecord,
} from "#/entities/applications/repositories/writeApplicationRepository";

describe("writeApplicationRepository", () => {
  it("upserts an applied application record", async () => {
    const upsert = vi.fn().mockResolvedValue({
      error: null,
    });
    const from = vi.fn().mockReturnValue({ upsert });

    await expect(
      applyToEventRecord(
        {
          eventId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          userId: "33333333-3333-4333-8333-333333333333",
        },
        { client: { from } as never }
      )
    ).resolves.toBeUndefined();

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        status: "applied",
        user_id: "33333333-3333-4333-8333-333333333333",
      }),
      { onConflict: "event_id,user_id" }
    );
  });

  it("updates an existing application to cancelled", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "55555555-5555-4555-8555-555555555555" },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const secondEq = vi.fn().mockReturnValue({ select });
    const firstEq = vi.fn().mockReturnValue({ eq: secondEq });
    const update = vi.fn().mockReturnValue({ eq: firstEq });
    const from = vi.fn().mockReturnValue({ update });

    await expect(
      cancelEventApplicationRecord(
        {
          eventId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          userId: "33333333-3333-4333-8333-333333333333",
        },
        { client: { from } as never }
      )
    ).resolves.toBeUndefined();

    expect(update).toHaveBeenCalledWith({ status: "cancelled" });
    expect(firstEq).toHaveBeenCalledWith(
      "event_id",
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
    );
    expect(secondEq).toHaveBeenCalledWith(
      "user_id",
      "33333333-3333-4333-8333-333333333333"
    );
  });
});
