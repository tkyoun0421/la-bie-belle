import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const findOwnRoles = vi.fn();

vi.mock("@/entities/identity/api/find-own-roles", () => ({ findOwnRoles }));

beforeEach(() => {
  findOwnRoles.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("requireSuperAdmin", () => {
  it("super_admin 역할이 있으면 { ok: true, roles }를 반환한다", async () => {
    findOwnRoles.mockResolvedValue({ ok: true, data: ["worker", "admin", "super_admin"] });

    const { requireSuperAdmin } = await import("@/entities/identity/api/require-super-admin");
    const result = await requireSuperAdmin();

    expect(result).toEqual({ ok: true, roles: ["worker", "admin", "super_admin"] });
  });

  it("일반 admin은 super_admin이 아니므로 COMMON_FORBIDDEN으로 거부한다", async () => {
    findOwnRoles.mockResolvedValue({ ok: true, data: ["worker", "admin"] });

    const { requireSuperAdmin } = await import("@/entities/identity/api/require-super-admin");
    const result = await requireSuperAdmin();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
  });

  it("역할이 없으면 COMMON_FORBIDDEN으로 거부한다", async () => {
    findOwnRoles.mockResolvedValue({ ok: true, data: ["worker"] });

    const { requireSuperAdmin } = await import("@/entities/identity/api/require-super-admin");
    const result = await requireSuperAdmin();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
  });

  it("역할 조회 자체가 실패하면 그 오류 코드를 그대로 전달한다", async () => {
    findOwnRoles.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED });

    const { requireSuperAdmin } = await import("@/entities/identity/api/require-super-admin");
    const result = await requireSuperAdmin();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED });
  });
});
