import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const findOwnProfile = vi.fn();

vi.mock("@/entities/identity/api/find-own-profile", () => ({ findOwnProfile }));

beforeEach(() => {
  findOwnProfile.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("requireActiveProfile", () => {
  it("active profile이면 { ok: true, profile }을 반환한다", async () => {
    findOwnProfile.mockResolvedValue({ ok: true, data: { status: "active" } });

    const { requireActiveProfile } = await import("@/entities/identity/api/require-active-profile");
    const result = await requireActiveProfile();

    expect(result).toEqual({ ok: true, profile: { status: "active" } });
  });

  it("pending profile이면 IDENTITY_NOT_ACTIVE 코드로 거부한다", async () => {
    findOwnProfile.mockResolvedValue({ ok: true, data: { status: "pending" } });

    const { requireActiveProfile } = await import("@/entities/identity/api/require-active-profile");
    const result = await requireActiveProfile();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
  });

  it("profile이 없으면 IDENTITY_PROFILE_REQUIRED 코드로 거부한다", async () => {
    findOwnProfile.mockResolvedValue({ ok: true, data: null });

    const { requireActiveProfile } = await import("@/entities/identity/api/require-active-profile");
    const result = await requireActiveProfile();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_PROFILE_REQUIRED });
  });

  it("인증되지 않았으면 findOwnProfile의 오류 코드를 그대로 전달한다", async () => {
    findOwnProfile.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED });

    const { requireActiveProfile } = await import("@/entities/identity/api/require-active-profile");
    const result = await requireActiveProfile();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED });
  });

  it("거부 응답이 반복 호출에도 일관된다", async () => {
    findOwnProfile.mockResolvedValue({ ok: true, data: { status: "pending" } });

    const { requireActiveProfile } = await import("@/entities/identity/api/require-active-profile");

    const first = await requireActiveProfile();
    const second = await requireActiveProfile();

    expect(first).toEqual(second);
  });
});
