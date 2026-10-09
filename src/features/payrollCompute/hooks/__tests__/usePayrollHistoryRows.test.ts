import { jest } from "@jest/globals";

const useMyPayrollViewDaysQueryMock =
  jest.fn<(...args: unknown[]) => unknown>();

jest.unstable_mockModule(
  "@/features/payrollCompute/services/useMyPayrollViewDaysQuery",
  () => ({ useMyPayrollViewDaysQuery: useMyPayrollViewDaysQueryMock }),
);

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: {} as never,
}));

const { renderHook } = await import("@testing-library/react-native");
const { usePayrollHistoryRows } =
  await import("@/features/payrollCompute/hooks/usePayrollHistoryRows");

const SPAN = { from: "2026-10-01", to: "2026-10-31" };

const refetch = jest.fn();

function day(date: string, amount: number, kind = "normal") {
  return {
    date,
    minutes: 300,
    amount,
    kind,
    position: "메인",
    startsAt: "18:00",
    endsAt: "23:00",
    isEducation: false,
    overtimeMinutes: 0,
    rehearsalMinutes: 0,
    attendance: null,
  };
}

function reads(result: Record<string, unknown>) {
  useMyPayrollViewDaysQueryMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
    refetch,
    ...result,
  });
}

beforeEach(() => {
  useMyPayrollViewDaysQueryMock.mockReset();
  refetch.mockReset();
});

describe("usePayrollHistoryRows — 조각이 자기 내역 줄을 짠다", () => {
  it("날마다 줄이 서고 늦은 날이 위에 온다", () => {
    reads({ data: [day("2026-10-02", 50000), day("2026-10-09", 60000)] });

    const { result } = renderHook(() => usePayrollHistoryRows(SPAN));

    expect(result.current.state).toBe("ready");
    expect(result.current.rows).toHaveLength(2);
    expect(result.current.rows[0].date).toBe("2026-10-09");
  });

  it("줄이 포지션과 시각을 단다", () => {
    reads({ data: [day("2026-10-09", 60000)] });

    const { result } = renderHook(() => usePayrollHistoryRows(SPAN));

    expect(result.current.rows[0].subtitle).toContain("메인");
    expect(result.current.rows[0].amountLabel).toContain("60,000");
  });

  it("결근한 날은 금액 자리가 비고 결근이라 적는다", () => {
    reads({ data: [day("2026-10-09", 0, "absent")] });

    const { result } = renderHook(() => usePayrollHistoryRows(SPAN));

    expect(result.current.rows[0].subtitle).toBe("결근");
  });

  it("읽는 중에는 pending이고 줄이 없다", () => {
    reads({ isLoading: true });

    const { result } = renderHook(() => usePayrollHistoryRows(SPAN));

    expect(result.current.state).toBe("pending");
    expect(result.current.rows).toHaveLength(0);
  });

  it("읽기가 넘어지면 failed고 다시 시도할 손이 있다", () => {
    reads({ error: new Error("끊겼다") });

    const { result } = renderHook(() => usePayrollHistoryRows(SPAN));

    expect(result.current.state).toBe("failed");

    result.current.retry();

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
