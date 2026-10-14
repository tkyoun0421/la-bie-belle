import { jest } from "@jest/globals";
import { Appearance } from "react-native";

const store = new Map<string, string>();
const getItem = jest.fn(async (key: string) => store.get(key) ?? null);
const setItem = jest.fn(async (key: string, value: string) => {
  store.set(key, value);
});
const setScheme = jest.fn((_scheme: "light" | "dark" | null) => {});
type OsScheme = "light" | "dark" | null;
type OsListener = (event: { colorScheme: OsScheme }) => void;
const getOsScheme = jest.fn((): OsScheme => null);
const removeListener = jest.fn();
let osListener: OsListener | null = null;
const addChangeListener = jest.fn((listener: OsListener) => {
  osListener = listener;
  return { remove: removeListener };
});

jest.unstable_mockModule("@react-native-async-storage/async-storage", () => ({
  default: { getItem, setItem },
}));

Object.assign(Appearance, { getColorScheme: getOsScheme, addChangeListener });

jest.unstable_mockModule("react-native-css", () => ({
  colorScheme: { set: setScheme },
}));

const { THEME_STORAGE_KEY } = await import("@/shared/consts/theme.const");
const {
  readStoredTheme,
  writeStoredTheme,
  applyColorScheme,
  followOsColorScheme,
} = await import("@/shared/lib/themeStorage.lib");

beforeEach(() => {
  store.clear();
  setScheme.mockClear();
  getOsScheme.mockReset();
  getOsScheme.mockReturnValue(null);
  removeListener.mockClear();
  osListener = null;
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

  it("기기 설정대로이고 기기가 dark면 dark로 적용한다", () => {
    getOsScheme.mockReturnValue("dark");

    applyColorScheme("system");

    expect(setScheme).toHaveBeenLastCalledWith("dark");
  });

  it("기기 설정대로이고 기기 설정을 모르면 light로 적용한다", () => {
    getOsScheme.mockReturnValue(null);

    applyColorScheme("system");

    expect(setScheme).toHaveBeenLastCalledWith("light");
  });

  it("밝게를 골랐으면 기기가 dark여도 light로 적용한다", () => {
    getOsScheme.mockReturnValue("dark");

    applyColorScheme("light");

    expect(setScheme).toHaveBeenLastCalledWith("light");
  });
});

describe("followOsColorScheme — 기기 설정이 바뀌어도 고른 테마가 이긴다", () => {
  function emitOs(next: OsScheme): void {
    getOsScheme.mockReturnValue(next);
    osListener?.({ colorScheme: next });
  }

  it("밝게를 고른 상태에서 기기가 dark로 바뀌어도 light를 유지한다", () => {
    followOsColorScheme(() => "light");

    emitOs("dark");

    expect(setScheme).toHaveBeenLastCalledWith("light");
  });

  it("어둡게를 고른 상태에서 기기가 light로 바뀌어도 dark를 유지한다", () => {
    followOsColorScheme(() => "dark");

    emitOs("light");

    expect(setScheme).toHaveBeenLastCalledWith("dark");
  });

  it("기기 설정대로이면 바뀐 기기 값을 따른다", () => {
    followOsColorScheme(() => "system");

    emitOs("dark");

    expect(setScheme).toHaveBeenLastCalledWith("dark");
  });

  it("이벤트가 올 때의 현재 테마로 다시 적용한다", () => {
    let theme: "system" | "light" | "dark" = "light";
    followOsColorScheme(() => theme);
    theme = "system";

    emitOs("dark");

    expect(setScheme).toHaveBeenLastCalledWith("dark");
  });

  it("해제 함수를 부르면 구독을 거둔다", () => {
    const unsubscribe = followOsColorScheme(() => "system");

    unsubscribe();

    expect(removeListener).toHaveBeenCalled();
  });
});
