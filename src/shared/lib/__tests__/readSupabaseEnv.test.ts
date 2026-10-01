import { readSupabaseEnv } from "@/shared/lib/read-supabase-env";

const original = new Map<string, string | undefined>();

function assign(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

function stubEnv(name: string, value: string | undefined) {
  if (!original.has(name)) {
    original.set(name, process.env[name]);
  }

  assign(name, value);
}

afterEach(() => {
  for (const [name, value] of original) {
    assign(name, value);
  }

  original.clear();
});

describe("readSupabaseEnv — Supabase 접속에 필요한 env 둘을 읽는다", () => {
  it("두 env가 채워져 있으면 그 값을 그대로 돌려준다", () => {
    stubEnv("EXPO_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    stubEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    const result = readSupabaseEnv();

    expect(result).toEqual({
      url: "https://example.supabase.co",
      anonKey: "test-anon-key",
    });
  });

  it("EXPO_PUBLIC_SUPABASE_URL이 undefined면 던진다", () => {
    stubEnv("EXPO_PUBLIC_SUPABASE_URL", undefined);
    stubEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    expect(() => readSupabaseEnv()).toThrow(
      "환경 변수 EXPO_PUBLIC_SUPABASE_URL 값이 비어 있다. EXPO_PUBLIC_* 값은 빌드 시점에 번들에 박히니, 배포 환경에 값을 채우고 다시 빌드해야 한다.",
    );
  });

  it("EXPO_PUBLIC_SUPABASE_URL이 빈 문자열이면 던진다", () => {
    stubEnv("EXPO_PUBLIC_SUPABASE_URL", "");
    stubEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    expect(() => readSupabaseEnv()).toThrow(
      "환경 변수 EXPO_PUBLIC_SUPABASE_URL 값이 비어 있다. EXPO_PUBLIC_* 값은 빌드 시점에 번들에 박히니, 배포 환경에 값을 채우고 다시 빌드해야 한다.",
    );
  });

  it("EXPO_PUBLIC_SUPABASE_ANON_KEY가 undefined면 던진다", () => {
    stubEnv("EXPO_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    stubEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY", undefined);

    expect(() => readSupabaseEnv()).toThrow(
      "환경 변수 EXPO_PUBLIC_SUPABASE_ANON_KEY 값이 비어 있다. EXPO_PUBLIC_* 값은 빌드 시점에 번들에 박히니, 배포 환경에 값을 채우고 다시 빌드해야 한다.",
    );
  });

  it("EXPO_PUBLIC_SUPABASE_ANON_KEY가 빈 문자열이면 던진다", () => {
    stubEnv("EXPO_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    stubEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY", "");

    expect(() => readSupabaseEnv()).toThrow(
      "환경 변수 EXPO_PUBLIC_SUPABASE_ANON_KEY 값이 비어 있다. EXPO_PUBLIC_* 값은 빌드 시점에 번들에 박히니, 배포 환경에 값을 채우고 다시 빌드해야 한다.",
    );
  });
});
