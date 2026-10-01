// 구현 대상: src/features/stats/api/useStatsQueries.ts
//
// plan stats-admin의 「변경 파일」 표는 이 자리를 `queries.ts`로 적었지만 그 이름은
// tests/lint/fileNaming.ts가 막는다 — 훅을 내놓는 .ts는 이름이 `use`로 시작해야 한다
// (CLAUDE.md 「파일 이름은 부르는 이름을 따른다」). 파일과 짝 테스트를 같이 옮기고 아래
// import 경로 한 줄만 바꿨다. 단언은 그대로다.
//
// useWorkMonths(client, months) — 근무 탭의 열두 달 창을 읽는 훅이다. 달마다
// getMonthSchedule을 부르고(['schedule', 'YYYY-MM']) 달치를 useQueries로
// 나란히 읽는다(plan stats-admin AC-03「달마다 키를 읽어 더한다」).
//
// useAttendanceMonths(client, months) — 근태 탭의 열두 달 창이다. 근무 탭과 같은
// getMonthSchedule 열둘에 getMonthAttendance(['attendance', 'YYYY-MM']) 열둘이
// 더 붙는다 — 그달 배정·날 시각이 attendance-inputs.ts의 재료라서다.
//
// **결과가 달별로 구분돼 돌아온다.** useScheduleMonths·usePayrollMonths는
// flatMap으로 여러 달의 행을 하나의 배열로 뭉갠다. 이 훅은 그러면 안 된다 —
// 추이 그래프가 「몇 월이 비었나」를 알아야 해서, data는 달 수만큼의 길이고
// 항목마다 그 달의 month가 붙는다.
//
// usePayrollMonthsByMonth(client, months) — 급여 탭 그래프가 쓰는 달치
// 창이다. features/payroll/model/usePayrollMonths.ts가 이미 달치를 읽지만
// mergeMonths가 flatMap으로 여러 달을 하나로 뭉갠다 — 추이 그래프는 달마다
// 구분된 값이 필요해 그대로 못 쓴다(위 useWorkMonths·useAttendanceMonths와
// 같은 이유). features/stats가 features/payroll을 부르면 lint 규칙 3에
// 걸리므로 entities/payroll/dals/getPayrollMonth.ts의 getPayrollMonth·
// payrollMonthKey를 이 훅이 직접 부른다 — entities는 아래층이라 괜찮다.
// 쿼리 키도 payrollMonthKey를 그대로 써서 usePayrollMonths와 캐시를
// 나눈다.

import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getMonthScheduleMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/schedule/dals/getMonthSchedule", () => ({
  getMonthSchedule: getMonthScheduleMock,
}));

const getMonthAttendanceMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/entities/attendance/dals/getMonthAttendance",
  () => ({
    getMonthAttendance: getMonthAttendanceMock,
  }),
  { virtual: true },
);

const getFirstScheduleMonthMock =
  jest.fn<(...args: unknown[]) => Promise<string | null>>();

jest.unstable_mockModule(
  "@/entities/schedule/dals/getFirstScheduleMonth",
  () => ({
    getFirstScheduleMonth: getFirstScheduleMonthMock,
    firstScheduleMonthKey: () => ["schedule", "first-month"],
  }),
);

const getPayrollMonthMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/payroll/dals/getPayrollMonth", () => ({
  getPayrollMonth: getPayrollMonthMock,
  payrollMonthKey: (month: string) => ["payroll", month],
}));

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const {
  useWorkMonths,
  useAttendanceMonths,
  useFirstScheduleMonth,
  usePayrollMonthsByMonth,
} = await import("@/features/stats/api/useStatsQueries");

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
  getMonthAttendanceMock.mockReset();
  getFirstScheduleMonthMock.mockReset();
  getPayrollMonthMock.mockReset();
});

function emptyPayrollMonth() {
  return { wageRates: [], adjustments: [], excuseStatus: [], holidays: [] };
}

function emptyPayrollMonth1WageRate() {
  return {
    ...emptyPayrollMonth(),
    wageRates: [
      {
        profile_id: "profile-1",
        effective_date: "2026-08-01",
        amount: 12000,
        follows_default: false,
      },
    ],
  };
}

describe("useWorkMonths — 근무 탭은 달마다 getMonthSchedule만 부른다", () => {
  it("열두 달이면 getMonthSchedule이 정확히 12번, getMonthAttendance는 0번이다", async () => {
    getMonthScheduleMock.mockImplementation(async () => daysFor(1));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useWorkMonths(FAKE_CLIENT, TWELVE_MONTHS),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getMonthScheduleMock).toHaveBeenCalledTimes(12);
    expect(getMonthAttendanceMock).toHaveBeenCalledTimes(0);
  });
});

describe("useAttendanceMonths — 근태 탭은 schedule 열둘과 attendance 열둘, 스물넷을 부른다", () => {
  it("열두 달이면 getMonthSchedule 12번, getMonthAttendance 12번이다", async () => {
    getMonthScheduleMock.mockImplementation(async () => daysFor(1));
    getMonthAttendanceMock.mockImplementation(async () => ({
      checkIns: [],
      excuseStatuses: [],
    }));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useAttendanceMonths(FAKE_CLIENT, TWELVE_MONTHS),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getMonthScheduleMock).toHaveBeenCalledTimes(12);
    expect(getMonthAttendanceMock).toHaveBeenCalledTimes(12);
    expect(
      getMonthScheduleMock.mock.calls.length +
        getMonthAttendanceMock.mock.calls.length,
    ).toBe(24);
  });
});

describe("useWorkMonths — 결과가 달마다 구분돼 돌아온다(flatMap으로 뭉개지 않는다)", () => {
  it("한 달은 사흘치, 한 달은 빈 달이어도 data 길이가 달 수(2)와 같다", async () => {
    getMonthScheduleMock.mockImplementation(async (_client, month) =>
      month === "2026-08" ? daysFor(3) : daysFor(0),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useWorkMonths(FAKE_CLIENT, ["2026-08", "2026-09"]),
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

describe("useAttendanceMonths — 결과가 달마다 구분돼 돌아온다", () => {
  it("달마다 attendance 값이 따로 붙고 서로 안 섞인다", async () => {
    getMonthScheduleMock.mockImplementation(async () => daysFor(1));
    getMonthAttendanceMock.mockImplementation(async (_client, month) => ({
      checkIns: month === "2026-08" ? [{ id: "c1" }, { id: "c2" }] : [],
      excuseStatuses: [],
    }));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useAttendanceMonths(FAKE_CLIENT, ["2026-08", "2026-09"]),
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

describe("usePayrollMonthsByMonth — 달마다 getPayrollMonth를 부른다", () => {
  it("열두 달이면 getPayrollMonth가 정확히 12번 불린다", async () => {
    getPayrollMonthMock.mockImplementation(async () => emptyPayrollMonth());
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => usePayrollMonthsByMonth(FAKE_CLIENT, TWELVE_MONTHS),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getPayrollMonthMock).toHaveBeenCalledTimes(12);
  });
});

describe("usePayrollMonthsByMonth — 결과가 달마다 구분돼 돌아온다(flatMap으로 안 뭉갠다)", () => {
  it("한 달은 시급 행이 있고 한 달은 빈 달이어도 data 길이가 달 수(2)와 같다", async () => {
    getPayrollMonthMock.mockImplementation(async (_client, month) =>
      month === "2026-08" ? emptyPayrollMonth1WageRate() : emptyPayrollMonth(),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => usePayrollMonthsByMonth(FAKE_CLIENT, ["2026-08", "2026-09"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]?.month).toBe("2026-08");
    expect(result.current.data?.[0]?.payroll.wageRates).toHaveLength(1);
    expect(result.current.data?.[1]?.month).toBe("2026-09");
    expect(result.current.data?.[1]?.payroll.wageRates).toHaveLength(0);
  });

  it("빈 달이 있어도 data 길이가 요청한 달 수와 같다(하나라도 안 오면 로딩)", async () => {
    getPayrollMonthMock.mockImplementation(async () => emptyPayrollMonth());
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        usePayrollMonthsByMonth(FAKE_CLIENT, ["2026-08", "2026-09", "2026-10"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toHaveLength(3);
  });
});

describe("useFirstScheduleMonth — 키가 달을 안 물어 근무표 캐시 무효화에 그대로 얹힌다", () => {
  it("쿼리 캐시가 firstScheduleMonthKey()의 값인 ['schedule','first-month'] 자리에 값을 담는다", async () => {
    getFirstScheduleMonthMock.mockResolvedValue("2026-01-01");
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useFirstScheduleMonth(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(["schedule", "first-month"])).toBe(
      "2026-01-01",
    );
  });
});

describe("useFirstScheduleMonth — 근무표가 하나도 없으면 달 줄이 더는 뒤로 못 간다", () => {
  it("getFirstScheduleMonth가 null이면 훅의 data도 null이다", async () => {
    getFirstScheduleMonthMock.mockResolvedValue(null);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useFirstScheduleMonth(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });
});
