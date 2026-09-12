import { describe, expect, it, vi } from "vitest";
import { createSupabaseRequestClient } from "@/shared/lib/create-supabase-request-client";
import { createSupabaseServerClient } from "@/shared/lib/create-supabase-server-client";

const FAKE_COOKIE_STORE = { name: "fake-cookie-store" };
const FAKE_CLIENT = { name: "fake-supabase-client" };

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => FAKE_COOKIE_STORE),
}));

vi.mock("@/shared/lib/create-supabase-server-client", () => ({
  createSupabaseServerClient: vi.fn(() => FAKE_CLIENT),
}));

describe("createSupabaseRequestClient — Next 요청 쿠키로 서버 클라이언트를 만든다", () => {
  it("cookies()가 돌려준 저장소로 createSupabaseServerClient를 정확히 한 번 부른다", async () => {
    await createSupabaseRequestClient();

    expect(createSupabaseServerClient).toHaveBeenCalledTimes(1);
    expect(createSupabaseServerClient).toHaveBeenCalledWith(FAKE_COOKIE_STORE);
  });

  it("createSupabaseServerClient가 돌려준 클라이언트를 그대로 돌려준다", async () => {
    const result = await createSupabaseRequestClient();

    expect(result).toBe(FAKE_CLIENT);
  });
});
