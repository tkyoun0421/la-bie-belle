import { jest } from "@jest/globals";
import type { ReactNode } from "react";
import type { getFirstScheduleMonth } from "@/entities/schedule/api/getFirstScheduleMonth.api";

const getFirstScheduleMonthMock = jest.fn<typeof getFirstScheduleMonth>();

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: {} as never,
}));

jest.unstable_mockModule(
  "@/entities/schedule/api/getFirstScheduleMonth.api",
  () => ({ getFirstScheduleMonth: getFirstScheduleMonthMock }),
);

const { renderHook } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { serverClockStore } =
  await import("@/entities/clock/stores/clock.store");
const { useStatsMonthNav } =
  await import("@/features/stats/hooks/useStatsMonthNav");

const TWENTY_MINUTES_MS = 20 * 60 * 1000;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function wrapper({ children }: { children: ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  }

  return { wrapper };
}

beforeEach(() => {
  getFirstScheduleMonthMock.mockReset();
  getFirstScheduleMonthMock.mockResolvedValue("2026-01");
  serverClockStore.setState({ offset: 0 });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useStatsMonthNav — 다음 달 판정이 서버 시계를 따른다", () => {
  it("기기는 10월 말인데 서버 시계가 11월 1일이면 10월에서 다음 달로 갈 수 있다", () => {
    jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-31T14:50:00Z"));
    serverClockStore.setState({ offset: TWENTY_MINUTES_MS });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useStatsMonthNav("2026-10"), {
      wrapper,
    });

    expect(result.current.canGoNext).toBe(true);
  });

  it("서버 시계가 아직 10월이면 10월에서 다음 달로 못 간다", () => {
    jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-31T14:30:00Z"));
    serverClockStore.setState({ offset: TWENTY_MINUTES_MS });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useStatsMonthNav("2026-10"), {
      wrapper,
    });

    expect(result.current.canGoNext).toBe(false);
  });
});
