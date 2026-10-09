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
const { useStatsPayroll } =
  await import("@/features/payrollCompute/hooks/useStatsPayroll");

const SPAN = { from: "2026-10-01", to: "2026-10-31" };

const refetch = jest.fn();

function day(amount: number, kind = "normal", minutes = 300) {
  return {
    date: "2026-10-09",
    minutes,
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

describe("useStatsPayroll — 통계의 급여 칸이 자기 값을 든다", () => {
  it("금액과 예상치 안내와 보조 줄을 낸다", () => {
    reads({ data: [day(50000), day(60000)] });

    const { result } = renderHook(() => useStatsPayroll(SPAN));

    expect(result.current.state).toBe("ready");
    expect(result.current.amountLabel).toContain("110,000");
    expect(result.current.estimateNote).toBeTruthy();
    expect(result.current.subtitle).toBeTruthy();
  });

  it("보조 줄이 일한 횟수와 시간을 말한다", () => {
    reads({ data: [day(50000, "normal", 300), day(60000, "normal", 180)] });

    const { result } = renderHook(() => useStatsPayroll(SPAN));

    expect(result.current.subtitle).toContain("2건");
    expect(result.current.subtitle).toContain("8시간");
  });

  it("근무가 없어도 금액이 0원으로 선다", () => {
    reads({ data: [] });

    const { result } = renderHook(() => useStatsPayroll(SPAN));

    expect(result.current.amountLabel).toContain("0");
  });

  it("읽는 중에는 pending이다", () => {
    reads({ isLoading: true });

    const { result } = renderHook(() => useStatsPayroll(SPAN));

    expect(result.current.state).toBe("pending");
  });

  it("읽기가 넘어지면 failed고 다시 시도할 손이 있다", () => {
    reads({ error: new Error("끊겼다") });

    const { result } = renderHook(() => useStatsPayroll(SPAN));

    expect(result.current.state).toBe("failed");

    result.current.retry();

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
