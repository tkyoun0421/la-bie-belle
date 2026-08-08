import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const limit = vi.fn();
const order = vi.fn(() => ({ limit }));
const eq = vi.fn(() => ({ order }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

const createSupabaseServerClient = vi.fn(async () => ({ from }));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

beforeEach(() => {
  limit.mockReset();
  order.mockClear();
  eq.mockClear();
  select.mockClear();
  from.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("listScheduleRequirements", () => {
  it("스케줄의 필요 인원 표를 포지션명과 함께 조회한다", async () => {
    limit.mockResolvedValue({
      data: [
        { position_id: "position-1", required_count: 3, positions: { name: "팀장" } },
        { position_id: "position-2", required_count: 0, positions: { name: "드레스" } },
      ],
      error: null,
    });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result).toEqual({
      ok: true,
      data: [
        { positionId: "position-1", positionName: "팀장", requiredCount: 3 },
        { positionId: "position-2", positionName: "드레스", requiredCount: 0 },
      ],
    });
    expect(from).toHaveBeenCalledWith("schedule_position_requirements");
    expect(select).toHaveBeenCalledWith("position_id, required_count, positions(name)");
    expect(eq).toHaveBeenCalledWith("schedule_id", "schedule-1");
    expect(order).toHaveBeenCalledWith("position_id", { ascending: true });
    expect(limit).toHaveBeenCalledWith(1000);
  });

  it("조인된 포지션이 없는 행(FK 정합성 예외)은 결과에서 제외한다", async () => {
    limit.mockResolvedValue({
      data: [{ position_id: "orphan", required_count: 1, positions: null }],
      error: null,
    });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result).toEqual({ ok: true, data: [] });
  });

  it("42501은 IDENTITY_NOT_ACTIVE로 매핑한다", async () => {
    limit.mockResolvedValue({ data: null, error: { code: "42501", message: "denied" } });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
  });

  it("그 외 조회 오류는 COMMON_UNEXPECTED로 매핑한다", async () => {
    limit.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
