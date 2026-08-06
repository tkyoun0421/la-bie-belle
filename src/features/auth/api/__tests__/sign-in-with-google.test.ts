import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/shared/config/env.server", () => ({
  env: { NEXT_PUBLIC_APP_URL: "http://localhost:3000" },
}));

const signInWithOAuth = vi.fn();
const createSupabaseServerClient = vi.fn(async () => ({
  auth: { signInWithOAuth },
}));
const redirect = vi.fn();

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));
vi.mock("next/navigation", () => ({ redirect }));

beforeEach(() => {
  signInWithOAuth.mockReset();
  redirect.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("signInWithGoogle", () => {
  it("성공하면 Supabase authorize URL로 redirect한다", async () => {
    signInWithOAuth.mockResolvedValue({
      data: { provider: "google", url: "http://127.0.0.1:54321/auth/v1/authorize?provider=google" },
      error: null,
    });

    const { signInWithGoogle } = await import("@/features/auth/api/sign-in-with-google");
    await signInWithGoogle();

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "http://localhost:3000/auth/callback" },
    });
    expect(redirect).toHaveBeenCalledWith(
      "http://127.0.0.1:54321/auth/v1/authorize?provider=google",
    );
  });

  it("실패하면 /login?error=auth로 redirect한다", async () => {
    signInWithOAuth.mockResolvedValue({
      data: { provider: "google", url: null },
      error: { message: "boom" },
    });

    const { signInWithGoogle } = await import("@/features/auth/api/sign-in-with-google");
    await signInWithGoogle();

    expect(redirect).toHaveBeenCalledWith("/login?error=auth");
  });
});
