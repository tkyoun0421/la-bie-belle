import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getFirstScheduleMonthMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const TODAY = "2026-10-03";

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: {} as never,
}));

jest.unstable_mockModule(
  "@/entities/schedule/api/getFirstScheduleMonth.api",
  () => ({ getFirstScheduleMonth: getFirstScheduleMonthMock }),
);

jest.unstable_mockModule("@/shared/lib/kstToday.lib", () => ({
  kstToday: () => TODAY,
}));

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useStatsMonthNav } =
  await import("@/features/stats/hooks/useStatsMonthNav");

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
});

function mounted(month: string) {
  const { wrapper } = createWrapper();

  return renderHook(() => useStatsMonthNav(month), { wrapper });
}

describe("useStatsMonthNav — 조각이 자기 경계를 읽는다", () => {
  it("받은 달을 문안으로 낸다", () => {
    const { result } = mounted("2026-10");

    expect(result.current.label).toContain("10월");
  });

  it("첫 근무표가 오래면 뒤로 갈 수 있다", async () => {
    const { result } = mounted("2026-10");

    await waitFor(() => expect(result.current.canGoPrev).toBe(true));
  });

  it("첫 근무표보다 앞으로는 못 가고 다음 달로도 못 간다", async () => {
    getFirstScheduleMonthMock.mockResolvedValue("2026-10");

    const { result } = mounted("2026-10");

    await waitFor(() => expect(result.current.canGoPrev).toBe(false));

    expect(result.current.canGoNext).toBe(false);
  });

  it("첫 근무표를 아직 모르면 뒤로 못 간다", () => {
    const { result } = mounted("2026-10");

    expect(result.current.canGoPrev).toBe(false);
  });
});
