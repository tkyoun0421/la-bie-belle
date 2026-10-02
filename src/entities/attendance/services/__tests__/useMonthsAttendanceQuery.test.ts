// 구현 대상: src/entities/attendance/services/useMonthsAttendanceQuery.ts
//
// useMonthsAttendanceQuery(client, months) — 통계 근태 탭이 여는 열두 달 창의 근태 쪽이다.
// 달마다 getMonthAttendance를 부르고 `queryKeys.attendance.month`를 그대로 쓴다 — 근태
// 화면이 읽어둔 달은 캐시에서 온다.
//
// **근무 쪽과 갈려 있다.** 앞선 판은 근무 열둘과 근태 열둘을 한 useQueries에 스물넷으로
// 담았는데, 그러면 이 훅이 entities의 두 슬라이스를 함께 불러 `no-cross-slice-import`에
// 걸린다. 달마다 둘을 맞추는 일은 `features/stats/hooks/useAttendanceMonths.ts`가 한다
// (fsd-read-write-layers AC-05).

import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getMonthAttendanceMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/entities/attendance/api/getMonthAttendance.api",
  () => ({
    getMonthAttendance: getMonthAttendanceMock,
  }),
  { virtual: true },
);

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useMonthsAttendanceQuery } =
  await import("@/entities/attendance/services/useMonthsAttendanceQuery");

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

const TWELVE_MONTHS = Array.from(
  { length: 12 },
  (_, index) => `2026-${String(index + 1).padStart(2, "0")}`,
);

function emptyAttendance() {
  return { checkIns: [], excuseStatuses: [] };
}

beforeEach(() => {
  getMonthAttendanceMock.mockReset();
});

describe("useMonthsAttendanceQuery — 달마다 getMonthAttendance를 부른다", () => {
  it("열두 달이면 getMonthAttendance가 정확히 12번이다", async () => {
    getMonthAttendanceMock.mockImplementation(async () => emptyAttendance());
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMonthsAttendanceQuery(FAKE_CLIENT, TWELVE_MONTHS),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getMonthAttendanceMock).toHaveBeenCalledTimes(12);
  });
});

describe("useMonthsAttendanceQuery — 달마다 값이 따로 붙고 서로 안 섞인다", () => {
  it("한 달만 체크인이 둘이면 그 달 칸에만 둘이 붙는다", async () => {
    getMonthAttendanceMock.mockImplementation(async (_client, month) => ({
      checkIns: month === "2026-08" ? [{ id: "c1" }, { id: "c2" }] : [],
      excuseStatuses: [],
    }));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMonthsAttendanceQuery(FAKE_CLIENT, ["2026-08", "2026-09"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]?.month).toBe("2026-08");
    expect(result.current.data?.[0]?.attendance.checkIns).toHaveLength(2);
    expect(result.current.data?.[1]?.month).toBe("2026-09");
    expect(result.current.data?.[1]?.attendance.checkIns).toHaveLength(0);
  });
});

describe("useMonthsAttendanceQuery — 근태 화면과 캐시를 나눈다", () => {
  it("달마다 ['attendance', 'YYYY-MM'] 자리에 값이 앉는다", async () => {
    getMonthAttendanceMock.mockImplementation(async () => emptyAttendance());
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () => useMonthsAttendanceQuery(FAKE_CLIENT, ["2026-08"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["attendance", "2026-08"])).toEqual(
      emptyAttendance(),
    );
  });
});
