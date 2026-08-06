import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/shared/config/env.server", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    SUPABASE_SERVICE_ROLE_KEY: "local-service-role-key-fixture",
  },
}));

type CreateClientOptions = { auth: { autoRefreshToken: boolean; persistSession: boolean } };

const createClient = vi.fn(
  (_url: string, _key: string, _options: CreateClientOptions): { auth: object } => ({
    auth: {},
  }),
);

vi.mock("@supabase/supabase-js", () => ({ createClient }));

beforeEach(() => {
  createClient.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("createSupabaseServiceClient", () => {
  it("서비스 롤 키로 supabase-js 클라이언트를 만든다", async () => {
    const { createSupabaseServiceClient } = await import("@/shared/lib/supabase-service");
    const client = createSupabaseServiceClient();

    const [url, key, options] = createClient.mock.calls[0] ?? [];
    expect(url).toBe("http://127.0.0.1:54321");
    expect(key).toBe("local-service-role-key-fixture");
    expect(options).toEqual({ auth: { autoRefreshToken: false, persistSession: false } });
    expect(client.auth).toBeDefined();
  });

  it("호출할 때마다 새 클라이언트를 만든다(세션을 공유하지 않는다)", async () => {
    const { createSupabaseServiceClient } = await import("@/shared/lib/supabase-service");
    createSupabaseServiceClient();
    createSupabaseServiceClient();

    expect(createClient).toHaveBeenCalledTimes(2);
  });
});
