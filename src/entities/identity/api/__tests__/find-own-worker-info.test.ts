import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { FindDefaultHourlyWageResult } from "@/entities/identity/api/find-default-hourly-wage";
import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const maybeSingle = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));
const getUser = vi.fn();

const createSupabaseServerClient = vi.fn(async () => ({ from, auth: { getUser } }));
const findDefaultHourlyWage = vi.fn(async (): Promise<FindDefaultHourlyWageResult> => ({
  ok: true,
  data: 12000,
}));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));
vi.mock("@/entities/identity/api/find-default-hourly-wage", () => ({ findDefaultHourlyWage }));

beforeEach(() => {
  maybeSingle.mockReset();
  eq.mockClear();
  select.mockClear();
  from.mockClear();
  getUser.mockReset();
  getUser.mockResolvedValue({ data: { user: { id: "worker-1" } } });
  findDefaultHourlyWage.mockReset();
  findDefaultHourlyWage.mockResolvedValue({ ok: true, data: 12000 });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("findOwnWorkerInfo", () => {
  it("본인 정보와 기본 시급을 함께 반환한다", async () => {
    maybeSingle.mockResolvedValue({
      data: {
        name: "김근무",
        gender: "male",
        birth_date: "1990-01-01",
        phone: "01012345678",
        hourly_wage: null,
      },
      error: null,
    });

    const { findOwnWorkerInfo } = await import("@/entities/identity/api/find-own-worker-info");
    const result = await findOwnWorkerInfo();

    expect(result).toEqual({
      ok: true,
      data: {
        name: "김근무",
        gender: "male",
        birthDate: "1990-01-01",
        phone: "01012345678",
        hourlyWage: null,
        defaultHourlyWage: 12000,
      },
    });
    expect(eq).toHaveBeenCalledWith("id", "worker-1");
  });

  it("로그인하지 않았으면 COMMON_AUTH_REQUIRED를 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const { findOwnWorkerInfo } = await import("@/entities/identity/api/find-own-worker-info");
    const result = await findOwnWorkerInfo();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED });
  });

  it("프로필이 없으면 IDENTITY_PROFILE_REQUIRED를 반환한다", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });

    const { findOwnWorkerInfo } = await import("@/entities/identity/api/find-own-worker-info");
    const result = await findOwnWorkerInfo();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_PROFILE_REQUIRED });
  });

  it("조회 오류가 있으면 COMMON_UNEXPECTED를 반환한다", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { findOwnWorkerInfo } = await import("@/entities/identity/api/find-own-worker-info");
    const result = await findOwnWorkerInfo();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });

  it("기본 시급 조회가 실패하면 그 코드를 그대로 반환한다", async () => {
    maybeSingle.mockResolvedValue({
      data: {
        name: "김근무",
        gender: "male",
        birth_date: "1990-01-01",
        phone: "01012345678",
        hourly_wage: 15000,
      },
      error: null,
    });
    findDefaultHourlyWage.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });

    const { findOwnWorkerInfo } = await import("@/entities/identity/api/find-own-worker-info");
    const result = await findOwnWorkerInfo();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
