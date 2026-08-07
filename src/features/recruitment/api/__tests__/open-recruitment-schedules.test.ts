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

beforeEach(() => {
  requireAdmin.mockReset();
  rpc.mockReset();
  revalidatePath.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("openRecruitmentSchedules", () => {
  it("admin이면 rpc를 호출하고 성공 시 createdCount를 반환한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    rpc.mockResolvedValue({ data: { created_count: 2, conflict_dates: [] }, error: null });

    const { openRecruitmentSchedules } =
      await import("@/features/recruitment/api/open-recruitment-schedules");
    const result = await openRecruitmentSchedules({
      dates: ["2099-09-01", "2099-09-02"],
      applicationDeadline: "2099-09-01",
    });

    expect(result).toEqual({ ok: true, createdCount: 2 });
    expect(rpc).toHaveBeenCalledWith("open_recruitment_schedules", {
      work_dates: ["2099-09-01", "2099-09-02"],
      application_deadline: "2099-09-01",
    });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });

  it("admin이 아니면 rpc를 호출하지 않고 거부 코드를 그대로 전달한다", async () => {
    requireAdmin.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });

    const { openRecruitmentSchedules } =
      await import("@/features/recruitment/api/open-recruitment-schedules");
    const result = await openRecruitmentSchedules({
      dates: ["2099-09-01"],
      applicationDeadline: "2099-09-01",
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("입력 형식이 잘못되면 rpc 없이 SCHEDULING_VALIDATION을 반환한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });

    const { openRecruitmentSchedules } =
      await import("@/features/recruitment/api/open-recruitment-schedules");
    const result = await openRecruitmentSchedules({
      dates: ["2099/09/01"],
      applicationDeadline: "2099-09-01",
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("반환값에 conflict_dates가 있으면 충돌 코드와 목록을 반환한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    rpc.mockResolvedValue({
      data: { created_count: 0, conflict_dates: ["2099-09-02"] },
      error: null,
    });

    const { openRecruitmentSchedules } =
      await import("@/features/recruitment/api/open-recruitment-schedules");
    const result = await openRecruitmentSchedules({
      dates: ["2099-09-01", "2099-09-02"],
      applicationDeadline: "2099-09-01",
    });

    expect(result).toEqual({
      ok: false,
      code: ERROR_CODE.SCHEDULING_DATE_CONFLICT,
      conflictDates: ["2099-09-02"],
    });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });

  it("rpc 오류는 SQLSTATE 매핑을 거쳐 반환하되 재검증은 수행한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    rpc.mockResolvedValue({ data: null, error: { code: "23505", message: "conflict" } });

    const { openRecruitmentSchedules } =
      await import("@/features/recruitment/api/open-recruitment-schedules");
    const result = await openRecruitmentSchedules({
      dates: ["2099-09-01"],
      applicationDeadline: "2099-09-01",
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_DATE_CONFLICT });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });
});
