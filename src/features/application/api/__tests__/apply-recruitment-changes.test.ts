import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const getUser = vi.fn();
const rpc = vi.fn();
const createSupabaseServerClient = vi.fn(async () => ({ auth: { getUser }, rpc }));
const revalidatePath = vi.fn();

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));
vi.mock("next/cache", () => ({ revalidatePath }));

const APPLY_ID = "11111111-1111-4111-8111-111111111111";
const WITHDRAW_ID = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  getUser.mockReset();
  rpc.mockReset();
  revalidatePath.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("applyRecruitmentChanges", () => {
  it("미인증 사용자는 COMMON_AUTH_REQUIRED로 거부되고 rpc가 호출되지 않는다", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const { applyRecruitmentChanges } =
      await import("@/features/application/api/apply-recruitment-changes");
    const result = await applyRecruitmentChanges({
      applyScheduleIds: [APPLY_ID],
      withdrawScheduleIds: [],
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("입력 형식이 잘못되면 rpc 없이 SCHEDULING_VALIDATION을 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

    const { applyRecruitmentChanges } =
      await import("@/features/application/api/apply-recruitment-changes");
    const result = await applyRecruitmentChanges({
      applyScheduleIds: ["not-a-uuid"],
      withdrawScheduleIds: [],
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rpc 성공 시 appliedCount·withdrawnCount를 반환하고 재검증한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    rpc.mockResolvedValue({
      data: { applied_count: 1, withdrawn_count: 1, blocked_dates: [] },
      error: null,
    });

    const { applyRecruitmentChanges } =
      await import("@/features/application/api/apply-recruitment-changes");
    const result = await applyRecruitmentChanges({
      applyScheduleIds: [APPLY_ID],
      withdrawScheduleIds: [WITHDRAW_ID],
    });

    expect(rpc).toHaveBeenCalledWith("apply_recruitment_changes", {
      apply_schedule_ids: [APPLY_ID],
      withdraw_schedule_ids: [WITHDRAW_ID],
    });
    expect(result).toEqual({ ok: true, appliedCount: 1, withdrawnCount: 1 });
    expect(revalidatePath).toHaveBeenCalledWith("/schedule");
  });

  it("반환값에 blocked_dates가 있으면 차단 코드와 목록을 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    rpc.mockResolvedValue({
      data: { applied_count: 0, withdrawn_count: 0, blocked_dates: ["2099-09-02"] },
      error: null,
    });

    const { applyRecruitmentChanges } =
      await import("@/features/application/api/apply-recruitment-changes");
    const result = await applyRecruitmentChanges({
      applyScheduleIds: [APPLY_ID],
      withdrawScheduleIds: [],
    });

    expect(result).toEqual({
      ok: false,
      code: ERROR_CODE.SCHEDULING_APPLICATION_BLOCKED,
      blockedDates: ["2099-09-02"],
    });
    expect(revalidatePath).toHaveBeenCalledWith("/schedule");
  });

  it("rpc 오류는 SQLSTATE 매핑을 거쳐 반환하되 재검증은 수행한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "denied" } });

    const { applyRecruitmentChanges } =
      await import("@/features/application/api/apply-recruitment-changes");
    const result = await applyRecruitmentChanges({
      applyScheduleIds: [APPLY_ID],
      withdrawScheduleIds: [],
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
    expect(revalidatePath).toHaveBeenCalledWith("/schedule");
  });
});
