import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AdminAccessError,
  getCurrentAdminActor,
  requireAdminActor,
} from "#/shared/lib/auth/adminActor";
import { createSupabaseServerClient } from "#/shared/lib/supabase/server";

vi.mock("#/shared/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

const mockedCreateSupabaseServerClient = vi.mocked(createSupabaseServerClient);

describe("adminActor", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      BOOTSTRAP_ADMIN_EMAILS: undefined,
      ENABLE_DEVELOPMENT_ADMIN_BYPASS: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    };
  });

  it("allows development bypass when no allowlist is configured", async () => {
    await expect(getCurrentAdminActor()).resolves.toEqual({
      email: null,
      kind: "development_bypass",
      source: "development_bypass",
      userId: null,
    });

    expect(mockedCreateSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("returns a bootstrap admin actor for an allowlisted user", async () => {
    process.env.BOOTSTRAP_ADMIN_EMAILS = "admin@example.com, owner@example.com";
    mockedCreateSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              email: "Owner@Example.com",
              id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
            },
          },
          error: null,
        }),
      },
    } as never);

    await expect(getCurrentAdminActor()).resolves.toEqual({
      email: "owner@example.com",
      kind: "bootstrap_admin",
      source: "email_allowlist",
      userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    });
  });

  it("throws unauthenticated when allowlist exists but no user is signed in", async () => {
    process.env.BOOTSTRAP_ADMIN_EMAILS = "admin@example.com";
    mockedCreateSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: null,
          },
          error: null,
        }),
      },
    } as never);

    await expect(requireAdminActor()).rejects.toMatchObject({
      code: "unauthenticated",
      status: 401,
    });
  });

  it("throws unconfigured when bypass is disabled and no allowlist exists", async () => {
    process.env.ENABLE_DEVELOPMENT_ADMIN_BYPASS = "false";

    await expect(requireAdminActor()).rejects.toMatchObject({
      code: "unconfigured",
      status: 503,
    });
  });
});
