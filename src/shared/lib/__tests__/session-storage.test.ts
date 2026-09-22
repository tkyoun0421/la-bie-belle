import { jest } from "@jest/globals";

const secureStoreMap = new Map<string, string>();
const asyncStorageMap = new Map<string, string>();

jest.unstable_mockModule("expo-secure-store", () => ({
  getItemAsync: async (key: string) => secureStoreMap.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => {
    secureStoreMap.set(key, value);
  },
  deleteItemAsync: async (key: string) => {
    secureStoreMap.delete(key);
  },
}));

jest.unstable_mockModule("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (key: string) => asyncStorageMap.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      asyncStorageMap.set(key, value);
    },
    removeItem: async (key: string) => {
      asyncStorageMap.delete(key);
    },
  },
}));

jest.unstable_mockModule("react-native-get-random-values", () => ({}));

function fillSequential(bytes: Uint8Array): Uint8Array {
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = i % 256;
  }
  return bytes;
}

jest
  .spyOn(globalThis.crypto, "getRandomValues")
  .mockImplementation(
    fillSequential as unknown as typeof globalThis.crypto.getRandomValues,
  );

const { sessionStorage } = await import("@/shared/lib/session-storage");

function buildRealisticSessionJson(): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const longPayload = Buffer.from(
    JSON.stringify({
      sub: "user-1",
      exp: 9999999999,
      padding: "x".repeat(900),
    }),
  ).toString("base64url");
  const accessToken = `${header}.${longPayload}.signature-access`;
  const refreshToken = `${header}.${longPayload}.signature-refresh`;
  const user = {
    id: "user-1",
    email: "person@example.com",
    user_metadata: {
      full_name: "가짜 이름",
      avatar_url: "https://example.com/avatar.png",
    },
  };

  return JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: 9999999999,
    token_type: "bearer",
    user,
  });
}

describe("sessionStorage — SecureStore에 열쇠만, AsyncStorage에 본문을 가른다", () => {
  beforeEach(() => {
    secureStoreMap.clear();
    asyncStorageMap.clear();
  });

  it("setItem 뒤 getItem이 같은 문자열을 돌려준다", async () => {
    await sessionStorage.setItem("supabase.auth.token", "plain-session-value");

    const result = await sessionStorage.getItem("supabase.auth.token");

    expect(result).toBe("plain-session-value");
  });

  it("없는 열쇠를 읽으면 null이다", async () => {
    const result = await sessionStorage.getItem("no-such-key");

    expect(result).toBeNull();
  });

  it("2048바이트가 넘는 세션도 왕복하면 원문 그대로 돌아온다", async () => {
    const sessionJson = buildRealisticSessionJson();
    expect(sessionJson.length).toBeGreaterThan(2048);

    await sessionStorage.setItem("supabase.auth.token", sessionJson);
    const result = await sessionStorage.getItem("supabase.auth.token");

    expect(result).toBe(sessionJson);
  });

  it("SecureStore에는 열쇠 자료만 남고 세션 원문이 들어가지 않는다", async () => {
    const sessionJson = buildRealisticSessionJson();

    await sessionStorage.setItem("supabase.auth.token", sessionJson);

    const secureValues = Array.from(secureStoreMap.values());
    expect(secureValues.length).toBeGreaterThan(0);
    for (const value of secureValues) {
      expect(value.length).toBeLessThan(200);
      expect(value).not.toContain("person@example.com");
      expect(value).not.toContain("signature-access");
    }
  });

  it("SecureStore 값은 세션 크기와 무관하게 작고 고정된 길이다", async () => {
    await sessionStorage.setItem("key-a", "short");
    const shortLength = Array.from(secureStoreMap.values())[0]?.length;

    secureStoreMap.clear();

    await sessionStorage.setItem("key-b", buildRealisticSessionJson());
    const longLength = Array.from(secureStoreMap.values())[0]?.length;

    expect(shortLength).toBe(longLength);
  });

  it("AsyncStorage 쪽 값은 암호문이고 2048바이트를 넘어도 그대로 든다", async () => {
    const sessionJson = buildRealisticSessionJson();

    await sessionStorage.setItem("supabase.auth.token", sessionJson);

    const storedValues = Array.from(asyncStorageMap.values());
    expect(storedValues).toHaveLength(1);
    const stored = storedValues[0];
    expect(stored).not.toBe(sessionJson);
    expect(stored).not.toContain("person@example.com");
    expect(stored.length).toBeGreaterThan(2048);
  });

  it("removeItem이 SecureStore와 AsyncStorage 양쪽에서 지운다", async () => {
    await sessionStorage.setItem("supabase.auth.token", "value");

    await sessionStorage.removeItem("supabase.auth.token");

    expect(secureStoreMap.size).toBe(0);
    expect(asyncStorageMap.size).toBe(0);
    expect(await sessionStorage.getItem("supabase.auth.token")).toBeNull();
  });
});
