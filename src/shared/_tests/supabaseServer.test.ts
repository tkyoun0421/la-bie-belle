import { beforeEach, describe, expect, it, vi } from "vitest";

type MockCreateServerClientOptions = {
  cookies: {
    getAll: () => unknown;
    setAll: (
      cookiesToSet: Array<{
        name: string;
        options: Record<string, unknown>;
        value: string;
      }>,
      headers: Record<string, string>
    ) => void;
  };
};

const { mockCookieStore, mockedCookies, mockedCreateServerClient } = vi.hoisted(
  () => {
    const mockCookieStore = {
      getAll: vi.fn(),
      set: vi.fn(),
    };

    return {
      mockCookieStore,
      mockedCookies: vi.fn(async () => mockCookieStore),
      mockedCreateServerClient: vi.fn(
        (...args: [string, string, MockCreateServerClientOptions]) => {
          void args;

          return {
            auth: {},
          };
        }
      ),
    };
  }
);

vi.mock("next/headers", () => ({
  cookies: mockedCookies,
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mockedCreateServerClient,
}));

import { createSupabaseServerClient } from "#/shared/lib/supabase/server";

describe("createSupabaseServerClient", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    };
  });

  it("does not attach a cookie writer in read-only server contexts", async () => {
    await createSupabaseServerClient();

    const options =
      mockedCreateServerClient.mock.lastCall?.[2] as MockCreateServerClientOptions;

    expect(mockedCookies).toHaveBeenCalledTimes(1);
    expect(options.cookies.getAll).toBeTypeOf("function");
    expect(options.cookies.setAll).toBeTypeOf("function");
  });

  it("swallows cookie write failures in server component contexts", async () => {
    mockCookieStore.set.mockImplementationOnce(() => {
      throw new Error(
        "Cookies can only be modified in a Server Action or Route Handler."
      );
    });

    await createSupabaseServerClient();

    const options =
      mockedCreateServerClient.mock.lastCall?.[2] as MockCreateServerClientOptions;

    expect(options.cookies.setAll).toBeTypeOf("function");

    expect(() =>
      options.cookies.setAll([
        {
          name: "sb-access-token",
          options: { httpOnly: true },
          value: "token",
        },
      ], {})
    ).not.toThrow();
  });

  it("writes cookies when mutation is allowed by the runtime", async () => {
    await createSupabaseServerClient({ canSetCookies: true });

    const options =
      mockedCreateServerClient.mock.lastCall?.[2] as MockCreateServerClientOptions;

    options.cookies.setAll([
      {
        name: "sb-access-token",
        options: { httpOnly: true },
        value: "token",
      },
    ], {});

    expect(mockCookieStore.set).toHaveBeenCalledWith("sb-access-token", "token", {
      httpOnly: true,
    });
  });
});
