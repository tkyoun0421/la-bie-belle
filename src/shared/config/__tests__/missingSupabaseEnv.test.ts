type Input = { url?: string; anonKey?: string };

async function load() {
  const mod: Record<string, unknown> =
    await import("@/shared/config/supabase.config");
  const fn = mod.missingSupabaseEnv;

  if (typeof fn !== "function") {
    throw new Error("missingSupabaseEnv가 아직 없다");
  }

  return (env: Input): string[] => fn(env);
}

describe("missingSupabaseEnv — 비어 있는 Supabase env 이름을 모은다", () => {
  it("둘 다 채워져 있으면 빈 목록이다", async () => {
    const missingSupabaseEnv = await load();

    expect(
      missingSupabaseEnv({ url: "https://example.supabase.co", anonKey: "k" }),
    ).toEqual([]);
  });

  it("URL만 비면 URL 이름 하나다", async () => {
    const missingSupabaseEnv = await load();

    expect(missingSupabaseEnv({ url: "", anonKey: "k" })).toEqual([
      "EXPO_PUBLIC_SUPABASE_URL",
    ]);
  });

  it("키만 비면 키 이름 하나다", async () => {
    const missingSupabaseEnv = await load();

    expect(
      missingSupabaseEnv({ url: "https://example.supabase.co", anonKey: "" }),
    ).toEqual(["EXPO_PUBLIC_SUPABASE_ANON_KEY"]);
  });

  it("둘 다 비면 URL, 키 순서로 돌려준다", async () => {
    const missingSupabaseEnv = await load();

    expect(missingSupabaseEnv({ url: "", anonKey: "" })).toEqual([
      "EXPO_PUBLIC_SUPABASE_URL",
      "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    ]);
  });

  it("undefined인 값도 빈 것으로 본다", async () => {
    const missingSupabaseEnv = await load();

    expect(missingSupabaseEnv({ url: undefined, anonKey: undefined })).toEqual([
      "EXPO_PUBLIC_SUPABASE_URL",
      "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    ]);
  });
});
