// 구현 대상: src/entities/schedule/hooks/useWorkMonthsQuery.ts
//
// useWorkMonthsQuery(client, months) — 근무 탭의 열두 달 창을 읽는다. 달마다
// getMonthSchedule을 부르고(`queryKeys.schedule.month`) 달치를 useQueries로 나란히
// 읽는다(plan stats-admin AC-03「달마다 키를 읽어 더한다」).
//
// **새 키를 안 만드는 것이 이 방식의 값이다.** 근무표 화면이 이미 읽어둔 달은 캐시에서
// 오고, 그쪽 무효화가 이 화면에도 그대로 걸린다.
//
// **결과가 달별로 구분돼 돌아온다.** useScheduleMonthsQuery는 flatMap으로 여러 달의
// 행을 하나의 배열로 뭉갠다. 이 훅은 그러면 안 된다 — 추이 그래프가 「몇 월이 비었나」를
// 알아야 해서, data는 달 수만큼의 길이고 항목마다 그 달의 month가 붙는다.
//
// `features/stats/api/useStatsQueries.ts`에서 갈라져 나왔다 — 아래 단언은 그 파일의
// 짝 테스트가 들고 있던 것과 같다(fsd-read-write-layers AC-05).

import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getMonthScheduleMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/entities/schedule/api/getMonthSchedule.api",
  () => ({
    getMonthSchedule: getMonthScheduleMock,
  }),
);

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useWorkMonthsQuery } =
  await import("@/entities/schedule/hooks/useWorkMonthsQuery");

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

function daysFor(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `day-${index}`,
    work_date: "2026-09-01",
    starts_at: "10:00:00",
    ends_at: "18:00:00",
    assignments: [],
  }));
}

const TWELVE_MONTHS = Array.from(
  { length: 12 },
  (_, index) => `2026-${String(index + 1).padStart(2, "0")}`,
);

beforeEach(() => {
  getMonthScheduleMock.mockReset();
});

describe("useWorkMonthsQuery — 달마다 getMonthSchedule만 부른다", () => {
  it("열두 달이면 getMonthSchedule이 정확히 12번이다", async () => {
    getMonthScheduleMock.mockImplementation(async () => daysFor(1));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useWorkMonthsQuery(FAKE_CLIENT, TWELVE_MONTHS),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getMonthScheduleMock).toHaveBeenCalledTimes(12);
  });
});

describe("useWorkMonthsQuery — 결과가 달마다 구분돼 돌아온다(flatMap으로 뭉개지 않는다)", () => {
  it("한 달은 사흘치, 한 달은 빈 달이어도 data 길이가 달 수(2)와 같다", async () => {
    getMonthScheduleMock.mockImplementation(async (_client, month) =>
      month === "2026-08" ? daysFor(3) : daysFor(0),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useWorkMonthsQuery(FAKE_CLIENT, ["2026-08", "2026-09"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]).toMatchObject({
      month: "2026-08",
      days: expect.arrayContaining([expect.anything()]),
    });
    expect(result.current.data?.[0]?.days).toHaveLength(3);
    expect(result.current.data?.[1]).toEqual({ month: "2026-09", days: [] });
  });
});

describe("useWorkMonthsQuery — 근무표 화면과 캐시를 나눈다", () => {
  it("달마다 ['schedule', 'YYYY-MM'] 자리에 값이 앉는다", async () => {
    getMonthScheduleMock.mockImplementation(async () => daysFor(1));
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () => useWorkMonthsQuery(FAKE_CLIENT, ["2026-08"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["schedule", "2026-08"])).toHaveLength(1);
  });
});
