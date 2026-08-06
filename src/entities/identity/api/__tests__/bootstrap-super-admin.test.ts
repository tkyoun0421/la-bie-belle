import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/shared/config/env.server", () => ({
  env: { SUPER_ADMIN_EMAIL: "super-admin@labiebelle.test" },
}));

const rpc = vi.fn();
const createSupabaseServiceClient = vi.fn(() => ({ rpc }));

vi.mock("@/shared/lib/supabase-service", () => ({ createSupabaseServiceClient }));

beforeEach(() => {
  rpc.mockReset();
  createSupabaseServiceClient.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("bootstrapSuperAdmin", () => {
  it("SUPER_ADMIN_EMAIL과 일치하면 서비스 롤로 bootstrap_super_admin RPC를 호출한다", async () => {
    rpc.mockResolvedValue({ data: true, error: null });

    const { bootstrapSuperAdmin } = await import("@/entities/identity/api/bootstrap-super-admin");
    const result = await bootstrapSuperAdmin("super-admin@labiebelle.test");

    expect(result).toEqual({ ok: true, active: true });
    expect(createSupabaseServiceClient).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith("bootstrap_super_admin", {
      bootstrap_email: "super-admin@labiebelle.test",
    });
  });

  it("대소문자만 다른 이메일도 일치로 판정한다", async () => {
    rpc.mockResolvedValue({ data: true, error: null });

    const { bootstrapSuperAdmin } = await import("@/entities/identity/api/bootstrap-super-admin");
    const result = await bootstrapSuperAdmin("Super-Admin@LabieBelle.test");

    expect(result).toEqual({ ok: true, active: true });
    expect(rpc).toHaveBeenCalledOnce();
  });

  it("이메일이 일치하지 않으면 RPC를 호출하지 않고 무동작으로 반환한다", async () => {
    const { bootstrapSuperAdmin } = await import("@/entities/identity/api/bootstrap-super-admin");
    const result = await bootstrapSuperAdmin("someone-else@labiebelle.test");

    expect(result).toEqual({ ok: true, active: false });
    expect(createSupabaseServiceClient).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("이메일이 없으면(null·undefined) RPC를 호출하지 않고 무동작으로 반환한다", async () => {
    const { bootstrapSuperAdmin } = await import("@/entities/identity/api/bootstrap-super-admin");

    expect(await bootstrapSuperAdmin(null)).toEqual({ ok: true, active: false });
    expect(await bootstrapSuperAdmin(undefined)).toEqual({ ok: true, active: false });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("RPC가 false를 반환하면(대상이 active가 아님) active:false를 반환한다", async () => {
    rpc.mockResolvedValue({ data: false, error: null });

    const { bootstrapSuperAdmin } = await import("@/entities/identity/api/bootstrap-super-admin");
    const result = await bootstrapSuperAdmin("super-admin@labiebelle.test");

    expect(result).toEqual({ ok: true, active: false });
  });

  it("RPC 오류가 있으면 { ok: false }를 반환하고 예외를 던지지 않는다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { bootstrapSuperAdmin } = await import("@/entities/identity/api/bootstrap-super-admin");
    const result = await bootstrapSuperAdmin("super-admin@labiebelle.test");

    expect(result).toEqual({ ok: false });
  });

  it("RPC 오류가 있으면 개인정보 없이 원인을 관측 가능하게 기록한다", async () => {
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    rpc.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { bootstrapSuperAdmin } = await import("@/entities/identity/api/bootstrap-super-admin");
    await bootstrapSuperAdmin("super-admin@labiebelle.test");

    expect(stderrWrite).toHaveBeenCalledOnce();
    const logged = String(stderrWrite.mock.calls[0]?.[0] ?? "");
    expect(logged).toContain("57P01");
    expect(logged).not.toContain("boom");
    stderrWrite.mockRestore();
  });
});
