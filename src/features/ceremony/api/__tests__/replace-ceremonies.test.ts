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

const SCHEDULE_ID = "13000000-0000-4000-8000-000000000001";

describe("replaceCeremonies", () => {
  it("admin이면 rpc를 호출하고 성공 시 정렬된 목록과 changed를 반환한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    rpc.mockResolvedValue({
      data: { ceremony_times: ["10:00", "11:00"], changed: true },
      error: null,
    });

    const { replaceCeremonies } = await import("@/features/ceremony/api/replace-ceremonies");
    const result = await replaceCeremonies({
      scheduleId: SCHEDULE_ID,
      ceremonyTimes: ["11:00", "10:00"],
    });

    expect(result).toEqual({ ok: true, ceremonyTimes: ["10:00", "11:00"], changed: true });
    expect(rpc).toHaveBeenCalledWith("replace_schedule_ceremonies", {
      target_schedule_id: SCHEDULE_ID,
      ceremony_times: ["11:00", "10:00"],
    });
    expect(revalidatePath).toHaveBeenCalledWith(`/admin/schedule/${SCHEDULE_ID}`);
  });

  it("admin이 아니면 rpc를 호출하지 않고 거부 코드를 그대로 전달한다", async () => {
    requireAdmin.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });

    const { replaceCeremonies } = await import("@/features/ceremony/api/replace-ceremonies");
    const result = await replaceCeremonies({
      scheduleId: SCHEDULE_ID,
      ceremonyTimes: ["10:00"],
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("입력이 잘못되면(0개) rpc 없이 SCHEDULING_VALIDATION을 반환한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });

    const { replaceCeremonies } = await import("@/features/ceremony/api/replace-ceremonies");
    const result = await replaceCeremonies({ scheduleId: SCHEDULE_ID, ceremonyTimes: [] });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rpc 오류는 SQLSTATE 매핑을 거쳐 반환하되 revalidate는 수행한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    rpc.mockResolvedValue({ data: null, error: { code: "LB020", message: "status conflict" } });

    const { replaceCeremonies } = await import("@/features/ceremony/api/replace-ceremonies");
    const result = await replaceCeremonies({
      scheduleId: SCHEDULE_ID,
      ceremonyTimes: ["10:00"],
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_STATUS_CONFLICT });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });
});
