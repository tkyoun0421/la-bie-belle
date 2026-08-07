import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const order = vi.fn();
const ilike = vi.fn(() => ({ order }));
const eq = vi.fn(() => ({ order, ilike }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

const createSupabaseServerClient = vi.fn(async () => ({ from }));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

beforeEach(() => {
  order.mockReset();
  ilike.mockClear();
  eq.mockClear();
  select.mockClear();
  from.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("listWorkers", () => {
  it("기본값은 active 상태를 이름순으로 조회한다", async () => {
    order.mockResolvedValue({
      data: [{ id: "worker-1", name: "김근무", status: "active" }],
      error: null,
    });

    const { listWorkers } = await import("@/entities/identity/api/list-workers");
    const result = await listWorkers();

    expect(result).toEqual({
      ok: true,
      data: [{ id: "worker-1", name: "김근무", status: "active" }],
    });
    expect(from).toHaveBeenCalledWith("profiles");
    expect(select).toHaveBeenCalledWith("id, name, status");
    expect(eq).toHaveBeenCalledWith("status", "active");
    expect(ilike).not.toHaveBeenCalled();
    expect(order).toHaveBeenCalledWith("name", { ascending: true });
  });

  it("상태 필터를 지정하면 그 상태로 조회한다", async () => {
    order.mockResolvedValue({ data: [], error: null });

    const { listWorkers } = await import("@/entities/identity/api/list-workers");
    await listWorkers({ status: "dormant" });

    expect(eq).toHaveBeenCalledWith("status", "dormant");
  });

  it("검색어가 있으면 이름 ilike로 필터한다", async () => {
    order.mockResolvedValue({ data: [], error: null });

    const { listWorkers } = await import("@/entities/identity/api/list-workers");
    await listWorkers({ search: "김" });

    expect(ilike).toHaveBeenCalledWith("name", "%김%");
  });

  it("검색어의 앞뒤 공백만 있으면 필터하지 않는다", async () => {
    order.mockResolvedValue({ data: [], error: null });

    const { listWorkers } = await import("@/entities/identity/api/list-workers");
    await listWorkers({ search: "   " });

    expect(ilike).not.toHaveBeenCalled();
  });

  it("조회 오류가 있으면 COMMON_UNEXPECTED를 반환한다", async () => {
    order.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { listWorkers } = await import("@/entities/identity/api/list-workers");
    const result = await listWorkers();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
