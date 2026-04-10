import { describe, expect, it, vi } from "vitest";
import { createEventTemplateAction } from "#/mutations/events/actions/createEventTemplate";

describe("createEventTemplateAction", () => {
  it("calls the rpc function and returns the created template", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: "99999999-9999-4999-8999-999999999999",
      error: null,
    });

    const template = await createEventTemplateAction(
      {
        name: "주요 프리미엄 웨딩",
        isPrimary: true,
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
          isPrimary: true,
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
      p_created_by: null,
    });
    expect(template.name).toBe("주요 프리미엄 웨딩");
  });

  it("rejects invalid service time before hitting supabase", async () => {
    const rpc = vi.fn();

    await expect(
      createEventTemplateAction(
        {
          name: "잘못된 템플릿",
          firstServiceAt: "16:00",
          lastServiceEndAt: "10:30",
          slotDefaults: [
            {
              positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
              requiredCount: 1,
            },
          ],
        },
        {
          client: {
            rpc,
          } as never,
        }
      )
    ).rejects.toThrow("마지막 서비스 종료 시간");

    expect(rpc).not.toHaveBeenCalled();
  });
});
