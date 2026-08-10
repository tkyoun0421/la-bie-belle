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
const VALID_POSITION_ID = "22222222-2222-4222-8222-222222222222";
const VALID_PROFILE_ID = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  requireAdmin.mockReset();
  requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
  rpc.mockReset();
  revalidatePath.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("replacePositionAssignments", () => {
  it("admin은 replace_position_assignments RPC를 호출하고 배정 수를 반환한다", async () => {
    rpc.mockResolvedValue({ data: { assigned_count: 2, changed: true }, error: null });

    const { replacePositionAssignments } =
      await import("@/features/assignment/api/replace-position-assignments");
    const result = await replacePositionAssignments({
      scheduleId: VALID_SCHEDULE_ID,
      positionId: VALID_POSITION_ID,
      profileIds: [VALID_PROFILE_ID],
    });

    expect(result).toEqual({ ok: true, assignedCount: 2 });
    expect(rpc).toHaveBeenCalledWith("replace_position_assignments", {
      target_schedule_id: VALID_SCHEDULE_ID,
      target_position_id: VALID_POSITION_ID,
      profile_ids: [VALID_PROFILE_ID],
    });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });

  it("빈 배열(전원 해제)도 정상 호출한다", async () => {
    rpc.mockResolvedValue({ data: { assigned_count: 0, changed: true }, error: null });

    const { replacePositionAssignments } =
      await import("@/features/assignment/api/replace-position-assignments");
    const result = await replacePositionAssignments({
      scheduleId: VALID_SCHEDULE_ID,
      positionId: VALID_POSITION_ID,
      profileIds: [],
    });

    expect(result).toEqual({ ok: true, assignedCount: 0 });
  });

  it("admin이 아니면 RPC 호출 없이 거부 코드를 반환한다", async () => {
    requireAdmin.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });

    const { replacePositionAssignments } =
      await import("@/features/assignment/api/replace-position-assignments");
    const result = await replacePositionAssignments({
      scheduleId: VALID_SCHEDULE_ID,
      positionId: VALID_POSITION_ID,
      profileIds: [VALID_PROFILE_ID],
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("잘못된 입력은 RPC 호출 없이 SCHEDULING_VALIDATION을 반환한다", async () => {
    const { replacePositionAssignments } =
      await import("@/features/assignment/api/replace-position-assignments");
    const result = await replacePositionAssignments({
      scheduleId: "not-a-uuid",
      positionId: VALID_POSITION_ID,
      profileIds: [VALID_PROFILE_ID],
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("LB020(상태 충돌)은 SCHEDULING_STATUS_CONFLICT로 매핑한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "LB020", message: "confirmed" } });

    const { replacePositionAssignments } =
      await import("@/features/assignment/api/replace-position-assignments");
    const result = await replacePositionAssignments({
      scheduleId: VALID_SCHEDULE_ID,
      positionId: VALID_POSITION_ID,
      profileIds: [VALID_PROFILE_ID],
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_STATUS_CONFLICT });
  });

  it("LB023(자격 미달)은 SCHEDULING_ASSIGNMENT_NOT_ELIGIBLE로 매핑한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "LB023", message: "not eligible" } });

    const { replacePositionAssignments } =
      await import("@/features/assignment/api/replace-position-assignments");
    const result = await replacePositionAssignments({
      scheduleId: VALID_SCHEDULE_ID,
      positionId: VALID_POSITION_ID,
      profileIds: [VALID_PROFILE_ID],
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_ASSIGNMENT_NOT_ELIGIBLE });
  });

  it("22023(유효성)은 SCHEDULING_VALIDATION으로 매핑한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "22023", message: "inactive position" } });

    const { replacePositionAssignments } =
      await import("@/features/assignment/api/replace-position-assignments");
    const result = await replacePositionAssignments({
      scheduleId: VALID_SCHEDULE_ID,
      positionId: VALID_POSITION_ID,
      profileIds: [VALID_PROFILE_ID],
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION });
  });

  it("42501은 IDENTITY_NOT_ACTIVE로 매핑한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "forbidden" } });

    const { replacePositionAssignments } =
      await import("@/features/assignment/api/replace-position-assignments");
    const result = await replacePositionAssignments({
      scheduleId: VALID_SCHEDULE_ID,
      positionId: VALID_POSITION_ID,
      profileIds: [VALID_PROFILE_ID],
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
  });

  it("그 외 오류는 COMMON_UNEXPECTED로 매핑한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { replacePositionAssignments } =
      await import("@/features/assignment/api/replace-position-assignments");
    const result = await replacePositionAssignments({
      scheduleId: VALID_SCHEDULE_ID,
      positionId: VALID_POSITION_ID,
      profileIds: [VALID_PROFILE_ID],
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
