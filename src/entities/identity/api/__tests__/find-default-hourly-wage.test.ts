import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const single = vi.fn();
const select = vi.fn(() => ({ single }));
const from = vi.fn(() => ({ select }));

const createSupabaseServerClient = vi.fn(async () => ({ from }));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

beforeEach(() => {
  single.mockReset();
  select.mockClear();
  from.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("findDefaultHourlyWage", () => {
  it("venue_settings의 기본 시급을 반환한다", async () => {
    single.mockResolvedValue({ data: { default_hourly_wage: 12000 }, error: null });

    const { findDefaultHourlyWage } =
      await import("@/entities/identity/api/find-default-hourly-wage");
    const result = await findDefaultHourlyWage();

    expect(result).toEqual({ ok: true, data: 12000 });
    expect(from).toHaveBeenCalledWith("venue_settings");
    expect(select).toHaveBeenCalledWith("default_hourly_wage");
  });

  it("조회 오류가 있으면 COMMON_UNEXPECTED를 반환한다", async () => {
    single.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { findDefaultHourlyWage } =
      await import("@/entities/identity/api/find-default-hourly-wage");
    const result = await findDefaultHourlyWage();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
