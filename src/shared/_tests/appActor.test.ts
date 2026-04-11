import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCurrentAppActor,
  requireAppActor,
} from "#/shared/lib/auth/appActor";
import { createSupabaseServerClient } from "#/shared/lib/supabase/server";

vi.mock("#/shared/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

const mockedCreateSupabaseServerClient = vi.mocked(createSupabaseServerClient);

describe("appActor", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    };
  });

  it("uses the first member profile as a development fallback actor", async () => {
    mockedCreateSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    email: "member1@labiebelle.local",
                    id: "33333333-3333-4333-8333-333333333333",
                    name: "팀원1",
                    role: "member",
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      }),
    } as never);

    await expect(getCurrentAppActor()).resolves.toEqual({
      email: "member1@labiebelle.local",
      kind: "development_member",
      name: "팀원1",
      role: "member",
      source: "development_seed",
      userId: "33333333-3333-4333-8333-333333333333",
    });
  });

  it("returns the signed-in user profile when auth user and app profile match", async () => {
    mockedCreateSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              email: "member2@labiebelle.local",
              id: "44444444-4444-4444-8444-444444444444",
            },
          },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                email: "member2@labiebelle.local",
                id: "44444444-4444-4444-8444-444444444444",
                name: "팀원2",
                role: "member",
              },
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    await expect(requireAppActor()).resolves.toEqual({
      email: "member2@labiebelle.local",
      kind: "authenticated_user",
      name: "팀원2",
      role: "member",
      source: "auth_user",
      userId: "44444444-4444-4444-8444-444444444444",
    });
  });

  it("throws when a signed-in user has no app profile", async () => {
    mockedCreateSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              email: "ghost@labiebelle.local",
              id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
            },
          },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    await expect(requireAppActor()).rejects.toMatchObject({
      code: "profile_missing",
      status: 404,
    });
  });
});
