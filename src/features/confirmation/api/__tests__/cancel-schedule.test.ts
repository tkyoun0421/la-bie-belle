import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const requireAdmin = vi.fn();
const rpc = vi.fn();
const revalidatePath = vi.fn();

const createSupabaseServerClient = vi.fn(async () => ({ rpc }));

vi.mock("@/entities/identity/api/require-admin", () => ({ requireAdmin }));
vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));
vi.mock("next/cache", () => ({ revalidatePath }));

const VALID_SCHEDULE_ID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  requireAdmin.mockReset();
  requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
  rpc.mockReset();
  revalidatePath.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("cancelSchedule", () => {
  it("admin은 cancel_confirmed_schedule RPC를 scheduleId와 함께 호출한다", async () => {
    rpc.mockResolvedValue({ data: { revision: 3 }, error: null });

    const { cancelSchedule } = await import("@/features/confirmation/api/cancel-schedule");
    const result = await cancelSchedule({ scheduleId: VALID_SCHEDULE_ID });

    expect(result).toEqual({ ok: true, data: { revision: 3 } });
    expect(rpc).toHaveBeenCalledWith("cancel_confirmed_schedule", {
      target_schedule_id: VALID_SCHEDULE_ID,
    });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });

  it("admin이 아니면 RPC 호출 없이 거부 코드를 반환한다", async () => {
    requireAdmin.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });

    const { cancelSchedule } = await import("@/features/confirmation/api/cancel-schedule");
    const result = await cancelSchedule({ scheduleId: VALID_SCHEDULE_ID });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("잘못된 입력은 RPC 호출 없이 SCHEDULING_VALIDATION을 반환한다", async () => {
    const { cancelSchedule } = await import("@/features/confirmation/api/cancel-schedule");
    const result = await cancelSchedule({ scheduleId: "not-a-uuid" });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("LB032(상태 오류)는 SCHEDULING_CANCEL_INVALID_STATUS로 매핑한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "LB032", message: "invalid status" } });

    const { cancelSchedule } = await import("@/features/confirmation/api/cancel-schedule");
    const result = await cancelSchedule({ scheduleId: VALID_SCHEDULE_ID });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_CANCEL_INVALID_STATUS });
  });

  it("22023(존재하지 않는 스케줄)은 SCHEDULING_VALIDATION으로 매핑한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "22023", message: "not found" } });

    const { cancelSchedule } = await import("@/features/confirmation/api/cancel-schedule");
    const result = await cancelSchedule({ scheduleId: VALID_SCHEDULE_ID });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION });
  });

  it("42501은 IDENTITY_NOT_ACTIVE로 매핑한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "forbidden" } });

    const { cancelSchedule } = await import("@/features/confirmation/api/cancel-schedule");
    const result = await cancelSchedule({ scheduleId: VALID_SCHEDULE_ID });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
  });

  it("그 외 오류는 COMMON_UNEXPECTED로 매핑한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { cancelSchedule } = await import("@/features/confirmation/api/cancel-schedule");
    const result = await cancelSchedule({ scheduleId: VALID_SCHEDULE_ID });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
