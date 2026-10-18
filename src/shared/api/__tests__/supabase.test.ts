import { jest } from "@jest/globals";
import type { createSupabaseClient } from "@/shared/api/createSupabaseClient";

const original = new Map<string, string | undefined>();

function stubEnv(name: string, value: string | undefined) {
  if (!original.has(name)) {
    original.set(name, process.env[name]);
  }

  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

async function loadWith(url: string | undefined, anonKey: string | undefined) {
  stubEnv("EXPO_PUBLIC_SUPABASE_URL", url);
  stubEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY", anonKey);
  jest.resetModules();
  const client = { from: () => null };
  jest.unstable_mockModule("@/shared/api/createSupabaseClient", () => ({
    createSupabaseClient: jest.fn<typeof createSupabaseClient>(
      () => client as never,
    ),
  }));

  const mod: Record<string, unknown> = await import("@/shared/api/supabase");
  const loaded = {
    supabase: mod.supabase,
    supabaseConfigured: mod.supabaseConfigured,
  };

  return { loaded, client };
}

afterEach(() => {
  for (const [name, value] of original) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }

  original.clear();
});

describe("supabase 클라이언트 모듈 — 값이 비어도 로드에서 던지지 않는다", () => {
  it("두 env가 비어도 import가 던지지 않고 supabaseConfigured가 false다", async () => {
    const { loaded } = await loadWith(undefined, undefined);

    expect(loaded.supabaseConfigured).toBe(false);
  });

  it("env가 비어도 클라이언트는 만들어져 내보내진다", async () => {
    const { loaded, client } = await loadWith("", "");

    expect(loaded.supabase).toBe(client);
  });

  it("URL만 비어도 false다", async () => {
    const { loaded } = await loadWith("", "k");

    expect(loaded.supabaseConfigured).toBe(false);
  });

  it("키만 비어도 false다", async () => {
    const { loaded } = await loadWith("https://example.supabase.co", "");

    expect(loaded.supabaseConfigured).toBe(false);
  });

  it("두 env가 채워지면 true다", async () => {
    const { loaded } = await loadWith("https://example.supabase.co", "k");

    expect(loaded.supabaseConfigured).toBe(true);
  });
});
