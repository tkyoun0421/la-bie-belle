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
const { readStoredOffset, writeStoredOffset, clearStoredOffset } =
  await import("@/entities/clock/lib/clockStorage.lib");

beforeEach(() => {
  store.clear();
  removeItem.mockReset();
  removeItem.mockImplementation(async (key: string) => {
    store.delete(key);
  });
});

describe("readStoredOffset — 저장된 오프셋 글자를 읽는다", () => {
  it("저장된 글자를 그대로 돌려준다", async () => {
    store.set(SERVER_CLOCK_STORAGE_KEY, "-300");

    await expect(readStoredOffset()).resolves.toBe("-300");
  });

  it("저장된 것이 없으면 null이다", async () => {
    await expect(readStoredOffset()).resolves.toBeNull();
  });
});

describe("writeStoredOffset — 오프셋을 글자로 저장한다", () => {
  it("서버 시계 키에 숫자를 글자로 쓴다", async () => {
    writeStoredOffset(1200);
    await Promise.resolve();

    expect(store.get(SERVER_CLOCK_STORAGE_KEY)).toBe("1200");
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
