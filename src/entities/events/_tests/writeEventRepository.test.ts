import { describe, expect, it, vi } from "vitest";
import { eventErrorCodes } from "#/entities/events/models/errors/eventError";
import { createEventRecord } from "#/entities/events/repositories/writeEventRepository";

describe("writeEventRepository", () => {
  it("creates an event through the RPC contract", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: "99999999-9999-4999-8999-999999999999",
      error: null,
    });

    await expect(
      createEventRecord(
        {
          createdBy: null,
          eventDate: "2026-04-20",
          templateId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          title: "4월 20일 주말 웨딩",
        },
        { client: { rpc } as never }
      )
    ).resolves.toBe("99999999-9999-4999-8999-999999999999");

    expect(rpc).toHaveBeenCalledWith("create_event", {
      p_created_by: undefined,
      p_event_date: "2026-04-20",
      p_template_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      p_title: "4월 20일 주말 웨딩",
    });
  });

  it("maps missing template failures to a stable error code", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: {
        code: "P0002",
        message: "event template not found",
      },
    });

    await expect(
      createEventRecord(
        {
          createdBy: null,
          eventDate: "2026-04-20",
          templateId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          title: "4월 20일 주말 웨딩",
        },
        { client: { rpc } as never }
      )
    ).rejects.toMatchObject({
      code: eventErrorCodes.createTemplateNotFound,
    });
  });
});
