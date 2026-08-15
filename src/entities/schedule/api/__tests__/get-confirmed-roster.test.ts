import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const rpc = vi.fn();
const createSupabaseServerClient = vi.fn(async () => ({ rpc }));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

const VALID_SCHEDULE_ID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  rpc.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("getConfirmedRoster", () => {
  it("성공하면 get_confirmed_roster RPC 응답을 카멜 케이스 데이터로 매핑한다", async () => {
    rpc.mockResolvedValue({
      data: {
        planned_checkin: "09:00",
        planned_checkout: "18:00",
        ceremonies: ["10:00", "14:00"],
        roster: [
          {
            name: "정하은",
            position_name: "매니저",
            sort_order: 80,
            is_trainee: false,
            is_self: true,
          },
        ],
        revision: 2,
        revised_at: "2026-08-15T10:23:02.000000+00:00",
      },
      error: null,
    });

    const { getConfirmedRoster } = await import("@/entities/schedule/api/get-confirmed-roster");
    const result = await getConfirmedRoster(VALID_SCHEDULE_ID);

    expect(result).toEqual({
      ok: true,
      data: {
        plannedCheckin: "09:00",
        plannedCheckout: "18:00",
        ceremonyTimes: ["10:00", "14:00"],
        roster: [
          {
            name: "정하은",
            positionName: "매니저",
            sortOrder: 80,
            isTrainee: false,
            isSelf: true,
          },
        ],
        revision: 2,
        revisedAt: "2026-08-15T10:23:02.000000+00:00",
      },
    });
    expect(rpc).toHaveBeenCalledWith("get_confirmed_roster", {
      target_schedule_id: VALID_SCHEDULE_ID,
    });
  });

  it("42501은 IDENTITY_NOT_ACTIVE로 매핑한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "forbidden" } });

    const { getConfirmedRoster } = await import("@/entities/schedule/api/get-confirmed-roster");
    const result = await getConfirmedRoster(VALID_SCHEDULE_ID);

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
  });

  it("LB031은 SCHEDULING_ROSTER_NOT_CONFIRMED로 매핑한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "LB031", message: "not confirmed" } });

    const { getConfirmedRoster } = await import("@/entities/schedule/api/get-confirmed-roster");
    const result = await getConfirmedRoster(VALID_SCHEDULE_ID);

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_ROSTER_NOT_CONFIRMED });
  });

  it("22023은 COMMON_NOT_FOUND로 매핑한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "22023", message: "not found" } });

    const { getConfirmedRoster } = await import("@/entities/schedule/api/get-confirmed-roster");
    const result = await getConfirmedRoster(VALID_SCHEDULE_ID);

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_NOT_FOUND });
  });

  it("그 외 오류는 COMMON_UNEXPECTED로 매핑한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { getConfirmedRoster } = await import("@/entities/schedule/api/get-confirmed-roster");
    const result = await getConfirmedRoster(VALID_SCHEDULE_ID);

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
