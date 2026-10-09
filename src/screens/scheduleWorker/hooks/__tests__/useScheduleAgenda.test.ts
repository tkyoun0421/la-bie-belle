import { jest } from "@jest/globals";

const { renderHook } = await import("@testing-library/react-native");
const { useScheduleAgenda } =
  await import("@/screens/scheduleWorker/hooks/useScheduleAgenda");

type Entry = Parameters<typeof useScheduleAgenda>[0]["entries"][number];

function entryAt(workDate: string, extra: Partial<Entry> = {}): Entry {
  return {
    workDate,
    myAssignment: null,
    rows: [],
    showActions: false,
    ...extra,
  };
}

function inputOf(entries: Entry[], expanded: string[] = []) {
  return {
    entries,
    expanded,
    onToggle: jest.fn(),
    onCancelShift: jest.fn(),
    onRequestSwap: jest.fn(),
  };
}

describe("useScheduleAgenda — 하루마다의 글월을 controller가 완성한다", () => {
  it("열린 날이 없으면 비었다고 말한다", () => {
    const { result } = renderHook(() => useScheduleAgenda(inputOf([])));

    expect(result.current.empty).toBe(true);
    expect(result.current.days).toEqual([]);
  });

  it("날짜가 사람이 읽는 글월로 선다", () => {
    const { result } = renderHook(() =>
      useScheduleAgenda(inputOf([entryAt("2026-10-03")])),
    );

    expect(result.current.days[0].title).toBe("10월 3일(토)");
  });

  it("근무가 없는 날은 옅은 색으로 없다고 말한다", () => {
    const { result } = renderHook(() =>
      useScheduleAgenda(inputOf([entryAt("2026-10-03")])),
    );

    expect(result.current.days[0].statusLabel).toBe("근무 없음");
    expect(result.current.days[0].statusTone).toBe("subtle");
  });

  it("내 근무가 있는 날은 포지션을 브랜드 색으로 말한다", () => {
    const { result } = renderHook(() =>
      useScheduleAgenda(
        inputOf([
          entryAt("2026-10-03", {
            myAssignment: { kind: "regular", position: "메인" },
          }),
        ]),
      ),
    );

    expect(result.current.days[0].statusLabel).toBe("메인");
    expect(result.current.days[0].statusTone).toBe("brand");
  });

  it("교육이면 포지션 앞에 교육이 붙는다", () => {
    const { result } = renderHook(() =>
      useScheduleAgenda(
        inputOf([
          entryAt("2026-10-03", {
            myAssignment: { kind: "training", position: "메인" },
          }),
        ]),
      ),
    );

    expect(result.current.days[0].statusLabel).toBe("교육 · 메인");
  });

  it("펼친 날만 펼쳐졌다고 말한다", () => {
    const { result } = renderHook(() =>
      useScheduleAgenda(
        inputOf([entryAt("2026-10-03"), entryAt("2026-10-04")], ["2026-10-04"]),
      ),
    );

    expect(result.current.days[0].expanded).toBe(false);
    expect(result.current.days[1].expanded).toBe(true);
  });

  it("첫 날에는 구분선이 없고 그 뒤에는 있다", () => {
    const { result } = renderHook(() =>
      useScheduleAgenda(
        inputOf([entryAt("2026-10-03"), entryAt("2026-10-04")]),
      ),
    );

    expect(result.current.days[0].divider).toBe(false);
    expect(result.current.days[1].divider).toBe(true);
  });

  it("손마다 그 날을 달고 밖으로 넘긴다", () => {
    const input = inputOf([entryAt("2026-10-03")]);
    const { result } = renderHook(() => useScheduleAgenda(input));

    result.current.days[0].toggle();
    result.current.days[0].cancelShift();
    result.current.days[0].requestSwap();

    expect(input.onToggle).toHaveBeenCalledWith("2026-10-03");
    expect(input.onCancelShift).toHaveBeenCalledWith("2026-10-03");
    expect(input.onRequestSwap).toHaveBeenCalledWith("2026-10-03");
  });
});
