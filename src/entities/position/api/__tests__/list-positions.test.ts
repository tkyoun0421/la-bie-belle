import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const limit = vi.fn();
const order = vi.fn(() => ({ limit }));
const select = vi.fn(() => ({ order }));
const from = vi.fn(() => ({ select }));

const createSupabaseServerClient = vi.fn(async () => ({ from }));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

beforeEach(() => {
  limit.mockReset();
  order.mockClear();
  select.mockClear();
  from.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("listPositions", () => {
  it("이름순 정렬과 상한을 명시해 전체 포지션(활성·비활성 포함)을 조회한다", async () => {
    limit.mockResolvedValue({
      data: [
        {
          id: "position-1",
          name: "팀장",
          code: "team_lead",
          default_required_count: 1,
          gender_requirement: "any",
          is_default: false,
          is_active: true,
        },
      ],
      error: null,
    });

    const { listPositions } = await import("@/entities/position/api/list-positions");
    const result = await listPositions();

    expect(result).toEqual({
      ok: true,
      data: [
        {
          id: "position-1",
          name: "팀장",
          code: "team_lead",
          defaultRequiredCount: 1,
          genderRequirement: "any",
          isDefault: false,
          isActive: true,
        },
      ],
    });
    expect(from).toHaveBeenCalledWith("positions");
    expect(select).toHaveBeenCalledWith(
      "id, name, code, default_required_count, gender_requirement, is_default, is_active",
    );
    expect(order).toHaveBeenCalledWith("name", { ascending: true });
    expect(limit).toHaveBeenCalledWith(1000);
  });

  it("조회 오류가 있으면 COMMON_UNEXPECTED를 반환한다", async () => {
    limit.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { listPositions } = await import("@/entities/position/api/list-positions");
    const result = await listPositions();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });

  it("42501은 IDENTITY_NOT_ACTIVE로 매핑한다", async () => {
    limit.mockResolvedValue({ data: null, error: { code: "42501", message: "denied" } });

    const { listPositions } = await import("@/entities/position/api/list-positions");
    const result = await listPositions();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
  });
});
