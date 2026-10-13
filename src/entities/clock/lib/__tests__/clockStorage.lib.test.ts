import { jest } from "@jest/globals";

const store = new Map<string, string>();
const removeItem = jest.fn(async (key: string) => {
  store.delete(key);
});

jest.unstable_mockModule("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (key: string) => store.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem,
  },
}));

const { SERVER_CLOCK_STORAGE_KEY } =
  await import("@/entities/clock/consts/clock.const");
const { readStoredOffset, clearStoredOffset } =
  await import("@/entities/clock/lib/clockStorage.lib");

beforeEach(() => {
  store.clear();
  removeItem.mockReset();
  removeItem.mockImplementation(async (key: string) => {
    store.delete(key);
  });
});

describe("clearStoredOffset — 저장된 서버 시계 오프셋을 지운다", () => {
  it("서버 시계 키를 지운다", async () => {
    store.set(SERVER_CLOCK_STORAGE_KEY, "1200");

    await clearStoredOffset();

    expect(await readStoredOffset()).toBeNull();
    expect(removeItem).toHaveBeenCalledWith(SERVER_CLOCK_STORAGE_KEY);
  });

  it("지우기가 던져도 삼킨다", async () => {
    removeItem.mockRejectedValue(new Error("disk"));

    await expect(clearStoredOffset()).resolves.toBeUndefined();
  });
});
