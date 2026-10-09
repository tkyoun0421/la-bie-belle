import { jest } from "@jest/globals";

const { renderHook } = await import("@testing-library/react-native");
const { useAdjustSheet } =
  await import("@/screens/scheduleAdmin/hooks/useAdjustSheet");

type Input = Parameters<typeof useAdjustSheet>[0];

const ROWS = [
  {
    profileId: "p1",
    name: "이준호",
    finalMinutes: 480,
    adjustmentKind: null,
    rehearsalLine: null,
  },
  {
    profileId: "p2",
    name: "박수진",
    finalMinutes: 0,
    adjustmentKind: "결근" as const,
    rehearsalLine: "리허설 2건 · 1시간",
  },
];

function input(over: Partial<Input> = {}): Input {
  return {
    head: "10:00–18:00 · 8시간",
    rows: ROWS,
    onPickPerson: jest.fn(),
    ...over,
  };
}

describe("useAdjustSheet — 줄마다 읽을 문구를 controller가 완성한다", () => {
  it("배정 시간과 조정 종류를 문구로 낸다", () => {
    const { result } = renderHook(() => useAdjustSheet(input()));

    expect(result.current.rows[0].hoursLabel).toBe("8시간");
    expect(result.current.rows[0].kindLabel).toBeNull();
    expect(result.current.rows[1].kindLabel).toBe("결근");
    expect(result.current.rows[1].accessibilityLabel).toContain("박수진");
  });

  it("첫 줄에만 구분선이 없다", () => {
    const { result } = renderHook(() => useAdjustSheet(input()));

    expect(result.current.rows[0].divider).toBe(false);
    expect(result.current.rows[1].divider).toBe(true);
  });

  it("줄을 누르면 그 사람 id로 간다", () => {
    const onPickPerson = jest.fn();
    const { result } = renderHook(() =>
      useAdjustSheet(input({ onPickPerson })),
    );

    result.current.rows[1].press();

    expect(onPickPerson).toHaveBeenCalledWith("p2");
  });

  it("아무도 없으면 비었다고 알리고 도움말을 접는다", () => {
    const { result } = renderHook(() => useAdjustSheet(input({ rows: [] })));

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.showHelp).toBe(false);
  });

  it("사람이 있으면 도움말이 선다", () => {
    const { result } = renderHook(() => useAdjustSheet(input()));

    expect(result.current.isEmpty).toBe(false);
    expect(result.current.showHelp).toBe(true);
    expect(result.current.head).toContain("10:00");
  });
});
