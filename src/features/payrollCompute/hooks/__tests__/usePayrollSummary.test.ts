import { jest } from "@jest/globals";

const usePayrollViewDaysQueryMock = jest.fn<(...args: unknown[]) => unknown>();

jest.unstable_mockModule(
  "@/features/payrollCompute/services/usePayrollViewDaysQuery",
  () => ({ usePayrollViewDaysQuery: usePayrollViewDaysQueryMock }),
);

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: {} as never,
}));

const { renderHook } = await import("@testing-library/react-native");
const { usePayrollSummary } =
  await import("@/features/payrollCompute/hooks/usePayrollSummary");

const SPAN = { from: "2026-10-01", to: "2026-10-31" };

const refetch = jest.fn();

function day(amount: number) {
  return {
    date: "2026-10-09",
    minutes: 300,
    amount,
    kind: "normal",
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
  usePayrollViewDaysQueryMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
    refetch,
    ...result,
  });
}

beforeEach(() => {
  usePayrollViewDaysQueryMock.mockReset();
  refetch.mockReset();
});

describe("usePayrollSummary — 조각이 자기 금액을 완성해 든다", () => {
  it("불러온 날의 금액을 합쳐 문안으로 낸다", () => {
    reads({ data: [day(50000), day(30000)] });

    const { result } = renderHook(() => usePayrollSummary(SPAN));

    expect(result.current.state).toBe("ready");
    expect(result.current.amountLabel).toContain("80,000");
  });

  it("예상치라는 안내를 같이 든다", () => {
    reads({ data: [day(50000)] });

    const { result } = renderHook(() => usePayrollSummary(SPAN));

    expect(result.current.estimateNote).toContain("예상치");
  });

  it("근무가 없어도 금액 자리가 빈 채로 선다", () => {
    reads({ data: [] });

    const { result } = renderHook(() => usePayrollSummary(SPAN));

    expect(result.current.state).toBe("ready");
    expect(result.current.amountLabel).toBeTruthy();
  });

  it("읽는 중에는 pending이다", () => {
    reads({ isLoading: true });

    const { result } = renderHook(() => usePayrollSummary(SPAN));

    expect(result.current.state).toBe("pending");
  });

  it("읽기가 넘어지면 failed고 다시 시도할 손이 있다", () => {
    reads({ error: new Error("끊겼다") });

    const { result } = renderHook(() => usePayrollSummary(SPAN));

    expect(result.current.state).toBe("failed");

    result.current.retry();

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("받은 구간을 그대로 service에 넘긴다", () => {
    reads({ data: [] });

    renderHook(() => usePayrollSummary(SPAN));

    expect(usePayrollViewDaysQueryMock).toHaveBeenCalledWith(
      expect.anything(),
      SPAN,
    );
  });
});
