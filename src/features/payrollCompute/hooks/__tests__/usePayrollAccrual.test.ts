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
const { usePayrollAccrual } =
  await import("@/features/payrollCompute/hooks/usePayrollAccrual");

const SPAN = { from: "2026-10-01", to: "2026-10-31" };

function day(kind: string, minutes: number) {
  return {
    date: "2026-10-09",
    minutes,
    amount: 50000,
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
    refetch: jest.fn(),
    ...result,
  });
}

beforeEach(() => {
  useMyPayrollViewDaysQueryMock.mockReset();
});

describe("usePayrollAccrual — 조각이 쌓인 근무를 말한다", () => {
  it("일한 횟수와 시간을 한 줄로 낸다", () => {
    reads({ data: [day("normal", 300), day("normal", 180)] });

    const { result } = renderHook(() => usePayrollAccrual(SPAN));

    expect(result.current.state).toBe("ready");
    expect(result.current.work).toContain("2회");
    expect(result.current.work).toContain("8시간");
  });

  it("결근한 날은 근무에서 빠진다", () => {
    reads({ data: [day("normal", 300), day("absent", 0)] });

    const { result } = renderHook(() => usePayrollAccrual(SPAN));

    expect(result.current.work).toContain("1회");
  });

  it("지각이 없으면 지각 줄이 없다", () => {
    reads({ data: [day("normal", 300)] });

    const { result } = renderHook(() => usePayrollAccrual(SPAN));

    expect(result.current.late).toBeNull();
  });

  it("읽는 중에는 pending이다", () => {
    reads({ isLoading: true });

    const { result } = renderHook(() => usePayrollAccrual(SPAN));

    expect(result.current.state).toBe("pending");
  });

  it("읽기가 넘어지면 failed다", () => {
    reads({ error: new Error("끊겼다") });

    const { result } = renderHook(() => usePayrollAccrual(SPAN));

    expect(result.current.state).toBe("failed");
  });
});
