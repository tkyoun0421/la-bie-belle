import { jest } from "@jest/globals";

const { renderHook } = await import("@testing-library/react-native");
const { serverClockStore } =
  await import("@/entities/clock/stores/clock.store");
const { useServerToday } = await import(
  // @ts-expect-error 대상 모듈이 아직 없다
  "@/entities/clock/hooks/useServerToday"
);

const TWENTY_MINUTES_MS = 20 * 60 * 1000;

function deviceAt(iso: string) {
  jest.spyOn(Date, "now").mockReturnValue(Date.parse(iso));
}

beforeEach(() => {
  serverClockStore.setState({ offset: 0 });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useServerToday — 서버 시계로 KST 날짜를 낸다", () => {
  it("기기는 전날 밤인데 서버가 20분 앞서 자정을 넘겼으면 다음 날을 낸다", () => {
    deviceAt("2026-10-02T14:50:00Z");
    serverClockStore.setState({ offset: TWENTY_MINUTES_MS });

    const { result } = renderHook(() => useServerToday());

    expect(result.current).toBe("2026-10-03");
  });

  it("기기는 자정을 넘겼는데 서버가 20분 뒤라 아직 전날이면 전날을 낸다", () => {
    deviceAt("2026-10-03T15:10:00Z");
    serverClockStore.setState({ offset: -TWENTY_MINUTES_MS });

    const { result } = renderHook(() => useServerToday());

    expect(result.current).toBe("2026-10-03");
  });

  it("오프셋이 0이면 기기 시각의 KST 날짜를 낸다", () => {
    deviceAt("2026-10-02T15:10:00Z");

    const { result } = renderHook(() => useServerToday());

    expect(result.current).toBe("2026-10-03");
  });

  it("같은 KST 날 안에서 1분이 지나 다시 그려도 같은 문자열이다", () => {
    deviceAt("2026-10-03T01:00:00Z");
    const { result, rerender } = renderHook(() => useServerToday());
    const first = result.current;

    deviceAt("2026-10-03T01:01:00Z");
    rerender({});

    expect(result.current).toBe(first);
  });
});
