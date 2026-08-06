import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const order = vi.fn();
const eq = vi.fn(() => ({ order }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

const createSupabaseServerClient = vi.fn(async () => ({ from }));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

beforeEach(() => {
  order.mockReset();
  eq.mockClear();
  select.mockClear();
  from.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("listPendingProfiles", () => {
  it("pending 프로필의 4필드와 신청 시각을 신청 순으로 반환한다", async () => {
    order.mockResolvedValue({
      data: [
        {
          id: "profile-1",
          name: "홍길동",
          gender: "male",
          birth_date: "1990-01-01",
          phone: "01012345678",
          created_at: "2026-08-07T00:00:00Z",
        },
      ],
      error: null,
    });

    const { listPendingProfiles } = await import("@/entities/identity/api/list-pending-profiles");
    const result = await listPendingProfiles();

    expect(result).toEqual({
      ok: true,
      data: [
        {
          id: "profile-1",
          name: "홍길동",
          gender: "male",
          birthDate: "1990-01-01",
          phone: "01012345678",
          createdAt: "2026-08-07T00:00:00Z",
        },
      ],
    });
    expect(from).toHaveBeenCalledWith("profiles");
    expect(select).toHaveBeenCalledWith("id, name, gender, birth_date, phone, created_at");
    expect(eq).toHaveBeenCalledWith("status", "pending");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: true });
  });

  it("결과가 없으면 빈 배열을 반환한다", async () => {
    order.mockResolvedValue({ data: [], error: null });

    const { listPendingProfiles } = await import("@/entities/identity/api/list-pending-profiles");
    const result = await listPendingProfiles();

    expect(result).toEqual({ ok: true, data: [] });
  });

  it("조회 오류가 있으면 { ok: false, code: COMMON_UNEXPECTED }를 반환한다", async () => {
    order.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { listPendingProfiles } = await import("@/entities/identity/api/list-pending-profiles");
    const result = await listPendingProfiles();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });

  it("조회 오류가 있으면 개인정보 없이 원인을 관측 가능하게 기록한다", async () => {
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    order.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { listPendingProfiles } = await import("@/entities/identity/api/list-pending-profiles");
    await listPendingProfiles();

    expect(stderrWrite).toHaveBeenCalledOnce();
    const logged = String(stderrWrite.mock.calls[0]?.[0] ?? "");
    expect(logged).toContain("57P01");
    expect(logged).not.toContain("boom");
    stderrWrite.mockRestore();
  });
});
