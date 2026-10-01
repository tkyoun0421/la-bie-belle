// 구현 대상: src/entities/schedule/hooks/useFirstScheduleMonthQuery.ts
//
// useFirstScheduleMonthQuery(client) — 통계의 달 줄이 뒤로 갈 수 있는 바닥이다. 홀 하나뿐이라
// 달을 옮겨도 다시 안 읽는다 — 키가 달을 안 물고(`['schedule', 'first-month']`) 근무표를
// 만드는 판정이 `['schedule']`을 통째로 낡게 해서 새 달이 생기면 저절로 따라온다.
//
// `features/stats/api/useStatsQueries.ts`에서 갈라져 나왔다 — 아래 단언은 그 파일의
// 짝 테스트가 들고 있던 것과 같다(fsd-read-write-layers AC-05).

import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getFirstScheduleMonthMock =
  jest.fn<(...args: unknown[]) => Promise<string | null>>();

jest.unstable_mockModule(
  "@/entities/schedule/api/getFirstScheduleMonth.api",
  () => ({
    getFirstScheduleMonth: getFirstScheduleMonthMock,
  }),
);

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useFirstScheduleMonthQuery } =
  await import("@/entities/schedule/hooks/useFirstScheduleMonthQuery");

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

  return { wrapper, queryClient };
}

const FAKE_CLIENT = {} as never;

beforeEach(() => {
  getFirstScheduleMonthMock.mockReset();
});

describe("useFirstScheduleMonthQuery — 키가 달을 안 물어 근무표 캐시 무효화에 그대로 얹힌다", () => {
  it("쿼리 캐시가 queryKeys.schedule.firstMonth()의 값인 ['schedule','first-month'] 자리에 값을 담는다", async () => {
    getFirstScheduleMonthMock.mockResolvedValue("2026-01-01");
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () => useFirstScheduleMonthQuery(FAKE_CLIENT),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(["schedule", "first-month"])).toBe(
      "2026-01-01",
    );
  });
});

describe("useFirstScheduleMonthQuery — 근무표가 하나도 없으면 달 줄이 더는 뒤로 못 간다", () => {
  it("getFirstScheduleMonth가 null이면 훅의 data도 null이다", async () => {
    getFirstScheduleMonthMock.mockResolvedValue(null);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useFirstScheduleMonthQuery(FAKE_CLIENT),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });
});
