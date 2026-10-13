import { jest } from "@jest/globals";

const store = new Map<string, string>();
const setScheme = jest.fn((_scheme: "light" | "dark" | null) => {});

jest.unstable_mockModule("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (key: string) => store.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      store.set(key, value);
    },
  },
}));

jest.unstable_mockModule("react-native-css", () => ({
  colorScheme: { set: setScheme },
}));

const { THEME_STORAGE_KEY } = await import("@/shared/consts/theme.const");
const { useTheme } = await import("@/shared/stores/theme.store");

beforeEach(() => {
  store.clear();
  setScheme.mockClear();
  useTheme.setState({ theme: "system", restored: false });
});

describe("useTheme.restore — 저장된 테마를 되살린다", () => {
  it("저장된 테마를 들고 복원됨으로 바뀐다", async () => {
    store.set(THEME_STORAGE_KEY, "dark");

    await useTheme.getState().restore();

    expect(useTheme.getState().theme).toBe("dark");
    expect(useTheme.getState().restored).toBe(true);
  });

  it("저장된 것이 없으면 기기 설정대로를 든다", async () => {
    await useTheme.getState().restore();

    expect(useTheme.getState().theme).toBe("system");
    expect(useTheme.getState().restored).toBe(true);
  });

  it("모르는 글자가 저장돼 있으면 기기 설정대로를 든다", async () => {
    store.set(THEME_STORAGE_KEY, "sepia");

    await useTheme.getState().restore();

    expect(useTheme.getState().theme).toBe("system");
  });

  it("되살린 테마를 색 구성표에 적용한다", async () => {
    store.set(THEME_STORAGE_KEY, "light");

    await useTheme.getState().restore();

    expect(setScheme).toHaveBeenLastCalledWith("light");
  });
});

describe("useTheme.choose — 고른 테마를 적용하고 저장한다", () => {
  it("고른 테마를 든다", () => {
    useTheme.getState().choose("dark");

    expect(useTheme.getState().theme).toBe("dark");
  });

  it("고른 테마를 색 구성표에 적용한다", () => {
    useTheme.getState().choose("dark");

    expect(setScheme).toHaveBeenLastCalledWith("dark");
  });

  it("고른 테마를 저장소에 쓴다", async () => {
    useTheme.getState().choose("light");
    await Promise.resolve();

    expect(store.get(THEME_STORAGE_KEY)).toBe("light");
  });
});
