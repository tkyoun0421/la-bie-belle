import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { FindDefaultHourlyWageResult } from "@/entities/identity/api/find-default-hourly-wage";
import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const profileMaybeSingle = vi.fn();
const profileEq = vi.fn(() => ({ maybeSingle: profileMaybeSingle }));
const profileSelect = vi.fn(() => ({ eq: profileEq }));

const positionsOrder = vi.fn();
const positionsEq = vi.fn(() => ({ order: positionsOrder }));
const positionsSelect = vi.fn(() => ({ eq: positionsEq }));

const eligibilitiesEq = vi.fn();
const eligibilitiesSelect = vi.fn(() => ({ eq: eligibilitiesEq }));

const from = vi.fn((table: string) => {
  if (table === "profiles") {
    return { select: profileSelect };
  }
  if (table === "positions") {
    return { select: positionsSelect };
  }
  if (table === "worker_position_eligibilities") {
    return { select: eligibilitiesSelect };
  }
  throw new Error(`unexpected table ${table}`);
});

const createSupabaseServerClient = vi.fn(async () => ({ from }));
const findDefaultHourlyWage = vi.fn(async (): Promise<FindDefaultHourlyWageResult> => ({
  ok: true,
  data: 12000,
}));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));
vi.mock("@/entities/identity/api/find-default-hourly-wage", () => ({ findDefaultHourlyWage }));

beforeEach(() => {
  profileMaybeSingle.mockReset();
  profileEq.mockClear();
  profileSelect.mockClear();
  positionsOrder.mockReset();
  positionsEq.mockClear();
  positionsSelect.mockClear();
  eligibilitiesEq.mockReset();
  eligibilitiesSelect.mockClear();
  from.mockClear();
  findDefaultHourlyWage.mockReset();
  findDefaultHourlyWage.mockResolvedValue({ ok: true, data: 12000 });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("findWorkerDetail", () => {
  it("근무자 상세를 조회하고 기본 포지션은 항상 부여됨으로 표시한다", async () => {
    profileMaybeSingle.mockResolvedValue({
      data: {
        id: "worker-1",
        name: "김근무",
        gender: "male",
        birth_date: "1990-01-01",
        phone: "01012345678",
        status: "active",
        hourly_wage: 15000,
      },
      error: null,
    });
    positionsOrder.mockResolvedValue({
      data: [
        { id: "pos-default", name: "안내", is_default: true, gender_requirement: "male" },
        { id: "pos-scan", name: "스캔", is_default: false, gender_requirement: "any" },
        { id: "pos-main", name: "메인", is_default: false, gender_requirement: "any" },
      ],
      error: null,
    });
    eligibilitiesEq.mockResolvedValue({ data: [{ position_id: "pos-scan" }], error: null });

    const { findWorkerDetail } = await import("@/entities/identity/api/find-worker-detail");
    const result = await findWorkerDetail("worker-1");

    expect(result).toEqual({
      ok: true,
      data: {
        id: "worker-1",
        name: "김근무",
        gender: "male",
        birthDate: "1990-01-01",
        phone: "01012345678",
        status: "active",
        hourlyWage: 15000,
        defaultHourlyWage: 12000,
        positions: [
          { id: "pos-default", name: "안내", isDefault: true, granted: true },
          { id: "pos-scan", name: "스캔", isDefault: false, granted: true },
          { id: "pos-main", name: "메인", isDefault: false, granted: false },
        ],
      },
    });
    expect(positionsEq).toHaveBeenCalledWith("is_active", true);
    expect(eligibilitiesEq).toHaveBeenCalledWith("profile_id", "worker-1");
  });

  it("기본 포지션의 성별 조건이 근무자와 다르면 목록에서 제외한다(F-05)", async () => {
    profileMaybeSingle.mockResolvedValue({
      data: {
        id: "worker-2",
        name: "이근무",
        gender: "female",
        birth_date: "1991-01-01",
        phone: "01099998888",
        status: "active",
        hourly_wage: null,
      },
      error: null,
    });
    positionsOrder.mockResolvedValue({
      data: [
        { id: "pos-guide", name: "안내", is_default: true, gender_requirement: "male" },
        { id: "pos-manager", name: "매니저", is_default: true, gender_requirement: "any" },
        {
          id: "pos-dress-default",
          name: "드레스보조",
          is_default: true,
          gender_requirement: "female",
        },
        { id: "pos-dress", name: "드레스", is_default: false, gender_requirement: "female" },
      ],
      error: null,
    });
    eligibilitiesEq.mockResolvedValue({ data: [], error: null });

    const { findWorkerDetail } = await import("@/entities/identity/api/find-worker-detail");
    const result = await findWorkerDetail("worker-2");

    expect(result.ok).toBe(true);
    const positions = result.ok && result.data !== null ? result.data.positions : [];
    expect(positions.map((position) => position.name)).toEqual(["매니저", "드레스보조", "드레스"]);
  });

  it("대상 프로필이 없으면 data: null을 반환한다", async () => {
    profileMaybeSingle.mockResolvedValue({ data: null, error: null });
    positionsOrder.mockResolvedValue({ data: [], error: null });
    eligibilitiesEq.mockResolvedValue({ data: [], error: null });

    const { findWorkerDetail } = await import("@/entities/identity/api/find-worker-detail");
    const result = await findWorkerDetail("missing-worker");

    expect(result).toEqual({ ok: true, data: null });
  });

  it("프로필 조회 오류가 있으면 COMMON_UNEXPECTED를 반환한다", async () => {
    profileMaybeSingle.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });
    positionsOrder.mockResolvedValue({ data: [], error: null });
    eligibilitiesEq.mockResolvedValue({ data: [], error: null });

    const { findWorkerDetail } = await import("@/entities/identity/api/find-worker-detail");
    const result = await findWorkerDetail("worker-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });

  it("포지션 조회 오류가 있으면 COMMON_UNEXPECTED를 반환한다", async () => {
    profileMaybeSingle.mockResolvedValue({
      data: {
        id: "worker-1",
        name: "김근무",
        gender: "male",
        birth_date: "1990-01-01",
        phone: "01012345678",
        status: "active",
        hourly_wage: null,
      },
      error: null,
    });
    positionsOrder.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });
    eligibilitiesEq.mockResolvedValue({ data: [], error: null });

    const { findWorkerDetail } = await import("@/entities/identity/api/find-worker-detail");
    const result = await findWorkerDetail("worker-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });

  it("기본 시급 조회가 실패하면 그 코드를 그대로 반환한다", async () => {
    profileMaybeSingle.mockResolvedValue({
      data: {
        id: "worker-1",
        name: "김근무",
        gender: "male",
        birth_date: "1990-01-01",
        phone: "01012345678",
        status: "active",
        hourly_wage: null,
      },
      error: null,
    });
    positionsOrder.mockResolvedValue({ data: [], error: null });
    eligibilitiesEq.mockResolvedValue({ data: [], error: null });
    findDefaultHourlyWage.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });

    const { findWorkerDetail } = await import("@/entities/identity/api/find-worker-detail");
    const result = await findWorkerDetail("worker-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
