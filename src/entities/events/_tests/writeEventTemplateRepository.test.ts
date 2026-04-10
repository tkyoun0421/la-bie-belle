import { describe, expect, it, vi } from "vitest";
import {
  countEventTemplateRecords,
  createEventTemplateRecord,
  deleteEventTemplateRecord,
  readEventTemplateDeleteSnapshot,
  updateEventTemplateRecord,
} from "#/entities/events/repositories/writeEventTemplateRepository";

describe("writeEventTemplateRepository", () => {
  it("creates an event template through the RPC contract", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: "99999999-9999-4999-8999-999999999999",
      error: null,
    });

    await expect(
      createEventTemplateRecord(
        {
          createdBy: null,
          firstServiceAt: "10:30",
          isPrimary: true,
          lastServiceEndAt: "16:00",
          name: "주요 프리미엄 웨딩",
          slotDefaults: [
            {
              positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
              requiredCount: 2,
              trainingCount: 0,
            },
          ],
        },
        { client: { rpc } as never }
      )
    ).resolves.toBe("99999999-9999-4999-8999-999999999999");

    expect(rpc).toHaveBeenCalledWith("create_event_template", {
      p_name: "주요 프리미엄 웨딩",
      p_is_primary: true,
      p_first_service_at: "10:30",
      p_last_service_end_at: "16:00",
      p_slot_defaults: [
        {
          position_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          required_count: 2,
          training_count: 0,
        },
      ],
      p_created_by: undefined,
    });
  });

  it("updates an event template through the RPC contract", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: "99999999-9999-4999-8999-999999999999",
      error: null,
    });

    await expect(
      updateEventTemplateRecord(
        {
          firstServiceAt: "10:30",
          id: "99999999-9999-4999-8999-999999999999",
          isPrimary: false,
          lastServiceEndAt: "16:00",
          name: "주요 프리미엄 웨딩",
          slotDefaults: [
            {
              positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
              requiredCount: 2,
              trainingCount: 0,
            },
          ],
        },
        { client: { rpc } as never }
      )
    ).resolves.toBe("99999999-9999-4999-8999-999999999999");

    expect(rpc).toHaveBeenCalledWith("update_event_template", {
      p_template_id: "99999999-9999-4999-8999-999999999999",
      p_name: "주요 프리미엄 웨딩",
      p_is_primary: false,
      p_first_service_at: "10:30",
      p_last_service_end_at: "16:00",
      p_slot_defaults: [
        {
          position_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          required_count: 2,
          training_count: 0,
        },
      ],
    });
  });

  it("maps the delete snapshot into a policy-friendly shape", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "99999999-9999-4999-8999-999999999999",
        is_primary: true,
      },
      error: null,
    });
    const select = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle }),
    });
    const from = vi.fn().mockReturnValue({ select });

    await expect(
      readEventTemplateDeleteSnapshot(
        "99999999-9999-4999-8999-999999999999",
        { client: { from } as never }
      )
    ).resolves.toEqual({
      id: "99999999-9999-4999-8999-999999999999",
      isPrimary: true,
    });
  });

  it("counts event template records", async () => {
    const select = vi.fn().mockResolvedValue({
      count: 3,
      error: null,
    });
    const from = vi.fn().mockReturnValue({ select });

    await expect(
      countEventTemplateRecords({ client: { from } as never })
    ).resolves.toBe(3);
  });

  it("deletes an event template record", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const deleteFn = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ delete: deleteFn });

    await expect(
      deleteEventTemplateRecord(
        "99999999-9999-4999-8999-999999999999",
        { client: { from } as never }
      )
    ).resolves.toBeUndefined();

    expect(eq).toHaveBeenCalledWith(
      "id",
      "99999999-9999-4999-8999-999999999999"
    );
  });
});
