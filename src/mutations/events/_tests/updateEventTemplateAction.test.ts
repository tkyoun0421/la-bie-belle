import { describe, expect, it, vi } from "vitest";
import { updateEventTemplateAction } from "#/mutations/events/actions/updateEventTemplate";

describe("updateEventTemplateAction", () => {
  it("calls the update rpc and returns the updated template", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: "99999999-9999-4999-8999-999999999999",
      error: null,
    });

    const template = await updateEventTemplateAction(
      {
        id: "99999999-9999-4999-8999-999999999999",
        name: "주요 프리미엄 웨딩",
        isPrimary: false,
        firstServiceAt: "10:30",
        lastServiceEndAt: "16:00",
        slotDefaults: [
          {
            positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
            requiredCount: 2,
          },
        ],
      },
      {
        client: {
          rpc,
        } as never,
        readById: vi.fn().mockResolvedValue({
          id: "99999999-9999-4999-8999-999999999999",
          name: "주요 프리미엄 웨딩",
          isPrimary: false,
          timeLabel: "10:30 - 16:00",
          firstServiceAt: "10:30",
          lastServiceEndAt: "16:00",
          createdAt: "2026-04-10T01:00:00.000Z",
          slotDefaults: [
            {
              positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
              positionName: "안내 메인",
              requiredCount: 2,
              trainingCount: 0,
            },
          ],
        }),
      }
    );

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
    expect(template.name).toBe("주요 프리미엄 웨딩");
  });
});
