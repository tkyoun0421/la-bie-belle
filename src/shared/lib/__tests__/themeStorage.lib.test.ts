import { jest } from "@jest/globals";

const store = new Map<string, string>();
const getItem = jest.fn(async (key: string) => store.get(key) ?? null);
const setItem = jest.fn(async (key: string, value: string) => {
  store.set(key, value);
});
const setScheme = jest.fn((_scheme: "light" | "dark" | null) => {});

jest.unstable_mockModule("@react-native-async-storage/async-storage", () => ({
  default: { getItem, setItem },
}));

jest.unstable_mockModule("react-native-css", () => ({
  colorScheme: { set: setScheme },
}));

const { THEME_STORAGE_KEY } = await import("@/shared/consts/theme.const");
const { readStoredTheme, writeStoredTheme, applyColorScheme } =
  await import("@/shared/lib/themeStorage.lib");

beforeEach(() => {
  store.clear();
  setScheme.mockClear();
  getItem.mockImplementation(async (key: string) => store.get(key) ?? null);
  setItem.mockImplementation(async (key: string, value: string) => {
    store.set(key, value);
  });
});

describe("readStoredTheme — 저장된 테마 글자를 읽는다", () => {
  it("저장된 글자를 그대로 돌려준다", async () => {
    store.set(THEME_STORAGE_KEY, "dark");

    await expect(readStoredTheme()).resolves.toBe("dark");
  });

  it("저장된 것이 없으면 null이다", async () => {
    await expect(readStoredTheme()).resolves.toBeNull();
  });

  it("읽기가 던지면 null이다", async () => {
    getItem.mockRejectedValue(new Error("disk"));

    await expect(readStoredTheme()).resolves.toBeNull();
  });
});

describe("writeStoredTheme — 테마 글자를 저장한다", () => {
  it("테마 키에 글자를 쓴다", async () => {
    writeStoredTheme("light");
    await Promise.resolve();

    expect(store.get(THEME_STORAGE_KEY)).toBe("light");
  });

  it("쓰기가 던져도 삼킨다", async () => {
    setItem.mockRejectedValue(new Error("disk"));

    expect(() => writeStoredTheme("dark")).not.toThrow();
    await Promise.resolve();
  });
});

describe("applyColorScheme — 테마를 색 구성표로 적용한다", () => {
  it("밝게는 light로 적용한다", () => {
    applyColorScheme("light");

    expect(setScheme).toHaveBeenLastCalledWith("light");
  });

  it("어둡게는 dark로 적용한다", () => {
    applyColorScheme("dark");

    expect(setScheme).toHaveBeenLastCalledWith("dark");
  });

  it("기기 설정대로는 null로 적용한다", () => {
    applyColorScheme("system");

    expect(setScheme).toHaveBeenLastCalledWith(null);
  });
});
