import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const getUser = vi.fn();
const inFilter = vi.fn();
const eq = vi.fn(() => ({ in: inFilter }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

const createSupabaseServerClient = vi.fn(async () => ({ auth: { getUser }, from }));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

beforeEach(() => {
  getUser.mockReset();
  inFilter.mockReset();
  eq.mockClear();
  select.mockClear();
  from.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("listOwnApplications", () => {
  it("scheduleIds가 비어 있으면 조회 없이 빈 배열을 반환한다", async () => {
    const { listOwnApplications } = await import("@/entities/schedule/api/list-own-applications");
    const result = await listOwnApplications({ scheduleIds: [] });

    expect(result).toEqual({ ok: true, data: [] });
    expect(from).not.toHaveBeenCalled();
  });

  it("미인증 사용자는 COMMON_AUTH_REQUIRED를 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const { listOwnApplications } = await import("@/entities/schedule/api/list-own-applications");
    const result = await listOwnApplications({ scheduleIds: ["schedule-1"] });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED });
    expect(from).not.toHaveBeenCalled();
  });

  it("본인 profile_id와 scheduleIds로 필터해 조회한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "profile-1" } }, error: null });
    inFilter.mockResolvedValue({
      data: [{ schedule_id: "schedule-1", status: "applied" }],
      error: null,
    });

    const { listOwnApplications } = await import("@/entities/schedule/api/list-own-applications");
    const result = await listOwnApplications({ scheduleIds: ["schedule-1", "schedule-2"] });

    expect(from).toHaveBeenCalledWith("applications");
    expect(select).toHaveBeenCalledWith("schedule_id, status");
    expect(eq).toHaveBeenCalledWith("profile_id", "profile-1");
    expect(inFilter).toHaveBeenCalledWith("schedule_id", ["schedule-1", "schedule-2"]);
    expect(result).toEqual({
      ok: true,
      data: [{ scheduleId: "schedule-1", status: "applied" }],
    });
  });

  it("조회 오류가 있으면 COMMON_UNEXPECTED를 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "profile-1" } }, error: null });
    inFilter.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { listOwnApplications } = await import("@/entities/schedule/api/list-own-applications");
    const result = await listOwnApplications({ scheduleIds: ["schedule-1"] });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
