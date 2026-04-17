import { describe, it, expect, vi } from "vitest";
import { GET } from "#/app/auth/callback/route";
import { createSupabaseServerClient } from "#/shared/lib/supabase/server";
import { NextRequest } from "next/server";

vi.mock("#/shared/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

describe("GET /auth/callback", () => {
  it("should exchange code for session and redirect to /", async () => {
    const mockAuth = {
      exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
    };
    const mockClient = {
      auth: mockAuth,
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as never);

    const url = new URL("http://localhost/auth/callback?code=test-code");
    const request = new NextRequest(url);

    const response = await GET(request);

    expect(mockAuth.exchangeCodeForSession).toHaveBeenCalledWith("test-code");
    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("http://localhost/");
  });

  it("should redirect to / if no code is provided", async () => {
    const url = new URL("http://localhost/auth/callback");
    const request = new NextRequest(url);

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("http://localhost/");
  });
});
