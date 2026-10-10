import { jest } from "@jest/globals";

const { renderHook } = await import("@testing-library/react-native");
const { serverClockStore } =
  await import("@/entities/clock/stores/clock.store");
const { nowWithOffset } =
  await import("@/entities/clock/model/serverClock.policy");
const { useServerNow } =
  // @ts-expect-error 대상 모듈이 아직 없다
  await import("@/entities/clock/hooks/useServerNow");

const DEVICE_NOW_MS = 1_760_000_000_000;

beforeEach(() => {
  serverClockStore.setState({ offset: 0 });
  jest.spyOn(Date, "now").mockReturnValue(DEVICE_NOW_MS);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useServerNow — 오프셋이 없으면 기기 시각 그대로다", () => {
  it("저장소 오프셋이 0일 때 nowWithOffset(기기시각, 0)과 같다", () => {
    const { result } = renderHook(() => useServerNow());

    expect(result.current).toBe(nowWithOffset(DEVICE_NOW_MS, 0));
  });
});

describe("useServerNow — 저장소의 오프셋이 지금 시각에 실린다", () => {
  it("저장소에 오프셋이 있으면 nowWithOffset(기기시각, 오프셋)과 같다", () => {
    serverClockStore.setState({ offset: 120_000 });

    const { result } = renderHook(() => useServerNow());

    expect(result.current).toBe(nowWithOffset(DEVICE_NOW_MS, 120_000));
  });
});
