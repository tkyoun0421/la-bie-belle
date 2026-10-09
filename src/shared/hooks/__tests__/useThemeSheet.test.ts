import { jest } from "@jest/globals";

const applyColorSchemeMock = jest.fn();
const writeStoredThemeMock = jest.fn();

jest.unstable_mockModule("@/shared/lib/themeStorage.lib", () => ({
  applyColorScheme: applyColorSchemeMock,
  readStoredTheme: jest.fn(async () => null),
  writeStoredTheme: writeStoredThemeMock,
}));

const { renderHook, act } = await import("@testing-library/react-native");
const { THEME_SHEET_TITLE } = await import("@/shared/consts/theme.const");
const { useTheme } = await import("@/shared/stores/theme.store");
const { useThemeSheet } = await import("@/shared/hooks/useThemeSheet");

const CHOSEN = jest.fn();

beforeEach(() => {
  applyColorSchemeMock.mockReset();
  writeStoredThemeMock.mockReset();
  CHOSEN.mockReset();
  useTheme.setState({ theme: "system" });
});

describe("useThemeSheet — 조각이 고를 것을 완성해 낸다", () => {
  it("고를 것 셋을 문안과 함께 낸다", () => {
    const { result } = renderHook(() => useThemeSheet(() => CHOSEN()));

    expect(result.current.title).toBe(THEME_SHEET_TITLE);
    expect(result.current.choices.map((choice) => choice.value)).toEqual([
      "system",
      "light",
      "dark",
    ]);
    expect(result.current.choices.map((choice) => choice.label)).toEqual([
      "기기 설정대로",
      "밝게",
      "어둡게",
    ]);
  });

  it("지금 쓰는 것에만 골랐다는 표시가 붙는다", () => {
    useTheme.setState({ theme: "dark" });

    const { result } = renderHook(() => useThemeSheet(() => CHOSEN()));

    expect(
      result.current.choices.filter((choice) => choice.selected),
    ).toHaveLength(1);
    expect(
      result.current.choices.find((choice) => choice.selected)?.value,
    ).toBe("dark");
  });

  it("고르면 기기에 적고 고른 뒤를 알린다", () => {
    const { result } = renderHook(() => useThemeSheet(() => CHOSEN()));

    act(() => result.current.choose("dark"));

    expect(useTheme.getState().theme).toBe("dark");
    expect(writeStoredThemeMock).toHaveBeenCalledWith("dark");
    expect(CHOSEN).toHaveBeenCalled();
  });
});
