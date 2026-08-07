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

describe("reopenRecruitmentSchedule", () => {
  it("admin이면 rpc를 호출하고 성공 시 ok를 반환한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    rpc.mockResolvedValue({ data: null, error: null });

    const { reopenRecruitmentSchedule } =
      await import("@/features/recruitment/api/reopen-recruitment-schedule");
    const result = await reopenRecruitmentSchedule({
      scheduleId: "13000000-0000-4000-8000-000000000001",
      newDeadline: "2099-09-01",
    });

    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("reopen_recruitment_schedule", {
      target_schedule_id: "13000000-0000-4000-8000-000000000001",
      new_deadline: "2099-09-01",
    });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });

  it("admin이 아니면 rpc를 호출하지 않고 거부 코드를 그대로 전달한다", async () => {
    requireAdmin.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });

    const { reopenRecruitmentSchedule } =
      await import("@/features/recruitment/api/reopen-recruitment-schedule");
    const result = await reopenRecruitmentSchedule({
      scheduleId: "13000000-0000-4000-8000-000000000001",
      newDeadline: "2099-09-01",
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("입력 형식이 잘못되면 rpc 없이 SCHEDULING_VALIDATION을 반환한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });

    const { reopenRecruitmentSchedule } =
      await import("@/features/recruitment/api/reopen-recruitment-schedule");
    const result = await reopenRecruitmentSchedule({
      scheduleId: "13000000-0000-4000-8000-000000000001",
      newDeadline: "2099/09/01",
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rpc 오류는 SQLSTATE 매핑을 거쳐 반환하되 재검증은 수행한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    rpc.mockResolvedValue({ data: null, error: { code: "LB021", message: "past date" } });

    const { reopenRecruitmentSchedule } =
      await import("@/features/recruitment/api/reopen-recruitment-schedule");
    const result = await reopenRecruitmentSchedule({
      scheduleId: "13000000-0000-4000-8000-000000000001",
      newDeadline: "2099-09-01",
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });
});
