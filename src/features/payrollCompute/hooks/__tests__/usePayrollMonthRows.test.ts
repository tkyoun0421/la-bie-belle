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
const { usePayrollMonthRows } =
  await import("@/features/payrollCompute/hooks/usePayrollMonthRows");

const SPAN = { from: "2026-01-01", to: "2026-12-31" };

const refetch = jest.fn();
const onOpenMonth = jest.fn<(month: string) => void>();

function day(date: string, amount: number) {
  return {
    date,
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
  useMyPayrollViewDaysQueryMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
    refetch,
    ...result,
  });
}

function mounted() {
  return renderHook(() => usePayrollMonthRows({ span: SPAN, onOpenMonth }));
}

beforeEach(() => {
  useMyPayrollViewDaysQueryMock.mockReset();
  refetch.mockReset();
  onOpenMonth.mockReset();
});

describe("usePayrollMonthRows — 조각이 달마다 금액을 모은다", () => {
  it("달마다 줄이 서고 합계가 끝에 온다", () => {
    reads({ data: [day("2026-09-02", 50000), day("2026-10-09", 60000)] });

    const { result } = mounted();

    expect(result.current.state).toBe("ready");
    expect(result.current.rows).toHaveLength(3);
    expect(result.current.rows[2].amountLabel).toContain("110,000");
  });

  it("같은 달의 금액을 한 줄로 합친다", () => {
    reads({ data: [day("2026-10-02", 50000), day("2026-10-09", 60000)] });

    const { result } = mounted();

    expect(result.current.rows[0].title).toBe("10월");
    expect(result.current.rows[0].amountLabel).toContain("110,000");
  });

  it("달 줄을 누르면 그 달을 받은 쪽에 넘긴다", () => {
    reads({ data: [day("2026-10-09", 60000)] });

    const { result } = mounted();

    result.current.rows[0].press?.();

    expect(onOpenMonth).toHaveBeenCalledWith("2026-10");
  });

  it("합계 줄은 누를 데가 없다", () => {
    reads({ data: [day("2026-10-09", 60000)] });

    const { result } = mounted();

    expect(result.current.rows[1].press).toBeUndefined();
  });

  it("읽는 중에는 pending이고 줄이 없다", () => {
    reads({ isLoading: true });

    const { result } = mounted();

    expect(result.current.state).toBe("pending");
    expect(result.current.rows).toHaveLength(0);
  });

  it("읽기가 넘어지면 failed고 다시 시도할 손이 있다", () => {
    reads({ error: new Error("끊겼다") });

    const { result } = mounted();

    expect(result.current.state).toBe("failed");

    result.current.retry();

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
