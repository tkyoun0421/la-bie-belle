import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getUser = vi.fn();
const maybeSingle = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

const createSupabaseServerClient = vi.fn(async () => ({
  auth: { getUser },
  from,
}));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

beforeEach(() => {
  getUser.mockReset();
  maybeSingle.mockReset();
  eq.mockClear();
  select.mockClear();
  from.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("findOwnProfile", () => {
  it("본인 profile 행이 있으면 true를 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    maybeSingle.mockResolvedValue({ data: { id: "user-1" }, error: null });

    const { findOwnProfile } = await import("@/entities/identity/api/find-own-profile");
    const result = await findOwnProfile();

    expect(result).toBe(true);
    expect(from).toHaveBeenCalledWith("profiles");
    expect(select).toHaveBeenCalledWith("id");
    expect(eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("본인 profile 행이 없으면 false를 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    maybeSingle.mockResolvedValue({ data: null, error: null });

    const { findOwnProfile } = await import("@/entities/identity/api/find-own-profile");
    const result = await findOwnProfile();

    expect(result).toBe(false);
  });

  it("조회 오류가 있으면 예외를 던진다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    maybeSingle.mockResolvedValue({ data: null, error: { message: "boom" } });

    const { findOwnProfile } = await import("@/entities/identity/api/find-own-profile");

    await expect(findOwnProfile()).rejects.toThrow();
  });

  it("인증된 사용자가 없으면 예외를 던진다", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const { findOwnProfile } = await import("@/entities/identity/api/find-own-profile");

    await expect(findOwnProfile()).rejects.toThrow();
    expect(from).not.toHaveBeenCalled();
  });
});
