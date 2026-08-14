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

describe("confirmSchedule", () => {
  it("admin은 confirm_schedule RPC를 scheduleId와 함께 호출한다", async () => {
    rpc.mockResolvedValue({
      data: { revision: 1, warnings: { understaffed: [], no_manager: [] } },
      error: null,
    });

    const { confirmSchedule } = await import("@/features/confirmation/api/confirm-schedule");
    const result = await confirmSchedule({ scheduleId: VALID_SCHEDULE_ID });

    expect(result).toEqual({ ok: true, revision: 1 });
    expect(rpc).toHaveBeenCalledWith("confirm_schedule", { target_schedule_id: VALID_SCHEDULE_ID });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });

  it("admin이 아니면 RPC 호출 없이 거부 코드를 반환한다", async () => {
    requireAdmin.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });

    const { confirmSchedule } = await import("@/features/confirmation/api/confirm-schedule");
    const result = await confirmSchedule({ scheduleId: VALID_SCHEDULE_ID });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("잘못된 입력은 RPC 호출 없이 SCHEDULING_VALIDATION을 반환한다", async () => {
    const { confirmSchedule } = await import("@/features/confirmation/api/confirm-schedule");
    const result = await confirmSchedule({ scheduleId: "not-a-uuid" });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("LB026(예식 없음)은 SCHEDULING_CONFIRM_NO_CEREMONY로 매핑한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "LB026", message: "no ceremony" } });

    const { confirmSchedule } = await import("@/features/confirmation/api/confirm-schedule");
    const result = await confirmSchedule({ scheduleId: VALID_SCHEDULE_ID });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_CONFIRM_NO_CEREMONY });
  });

  it("LB027(예정 시각 미설정)은 SCHEDULING_CONFIRM_NO_PLANNED_TIME으로 매핑한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "LB027", message: "no planned time" } });

    const { confirmSchedule } = await import("@/features/confirmation/api/confirm-schedule");
    const result = await confirmSchedule({ scheduleId: VALID_SCHEDULE_ID });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_CONFIRM_NO_PLANNED_TIME });
  });

  it("LB028(필요 인원 미복사)은 SCHEDULING_CONFIRM_NO_REQUIREMENTS로 매핑한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "LB028", message: "no requirements" } });

    const { confirmSchedule } = await import("@/features/confirmation/api/confirm-schedule");
    const result = await confirmSchedule({ scheduleId: VALID_SCHEDULE_ID });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_CONFIRM_NO_REQUIREMENTS });
  });

  it("LB029(상태 오류)는 SCHEDULING_CONFIRM_INVALID_STATUS로 매핑한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "LB029", message: "invalid status" } });

    const { confirmSchedule } = await import("@/features/confirmation/api/confirm-schedule");
    const result = await confirmSchedule({ scheduleId: VALID_SCHEDULE_ID });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_CONFIRM_INVALID_STATUS });
  });

  it("LB030(시급 미설정)은 SCHEDULING_CONFIRM_MISSING_WAGE로 매핑한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "LB030", message: "missing wage" } });

    const { confirmSchedule } = await import("@/features/confirmation/api/confirm-schedule");
    const result = await confirmSchedule({ scheduleId: VALID_SCHEDULE_ID });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_CONFIRM_MISSING_WAGE });
  });

  it("42501은 IDENTITY_NOT_ACTIVE로 매핑한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "forbidden" } });

    const { confirmSchedule } = await import("@/features/confirmation/api/confirm-schedule");
    const result = await confirmSchedule({ scheduleId: VALID_SCHEDULE_ID });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
  });

  it("그 외 오류는 COMMON_UNEXPECTED로 매핑한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { confirmSchedule } = await import("@/features/confirmation/api/confirm-schedule");
    const result = await confirmSchedule({ scheduleId: VALID_SCHEDULE_ID });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
