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

const createClientMock = jest.fn(
  (
    _url: string,
    _anonKey: string,
    _options: { auth: Record<string, unknown> },
  ) => ({ auth: {} }),
);

jest.unstable_mockModule("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

const { sessionStorage } = await import("@/shared/lib/session-storage");
const { createSupabaseClient } =
  await import("@/shared/lib/create-supabase-client");

describe("createSupabaseClient — 세션 관련 auth 설정 다섯을 고정해 createClient에 넘긴다", () => {
  beforeEach(() => {
    createClientMock.mockClear();
  });

  it("url·anonKey와 auth 설정 다섯을 그대로 createClient에 넘긴다", () => {
    createSupabaseClient("https://example.supabase.co", "anon-key");

    const call = createClientMock.mock.calls[0];
    expect(call).toBeDefined();
    const [url, anonKey, options] = call!;

    expect(url).toBe("https://example.supabase.co");
    expect(anonKey).toBe("anon-key");
    expect(options.auth).toEqual({
      storage: sessionStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: "pkce",
    });
  });
});
