import { jest } from "@jest/globals";
import type { PayrollDayKind } from "@/entities/payroll/model/payroll.type";
import type { PayrollViewDay } from "@/features/payrollCompute/model/payrollDays.policy";
import type {
  PayrollViewDaysResult,
  useMyPayrollViewDaysQuery,
} from "@/features/payrollCompute/services/useMyPayrollViewDaysQuery";

const useMyPayrollViewDaysQueryMock =
  jest.fn<typeof useMyPayrollViewDaysQuery>();

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
const PROFILE_ID = "me";

const refetch = jest.fn();

function day(
  date: string,
  amount: number,
  kind: PayrollDayKind = "normal",
): PayrollViewDay {
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

function reads(result: Partial<PayrollViewDaysResult>) {
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

    const { result } = renderHook(() =>
      usePayrollHistoryRows(SPAN, PROFILE_ID),
    );

    expect(result.current.state).toBe("ready");

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.rows).toHaveLength(2);
    expect(result.current.rows[0].date).toBe("2026-10-09");
  });

  it("줄이 포지션과 시각을 단다", () => {
    reads({ data: [day("2026-10-09", 60000)] });

    const { result } = renderHook(() =>
      usePayrollHistoryRows(SPAN, PROFILE_ID),
    );

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.rows[0].subtitle).toContain("메인");
    expect(result.current.rows[0].amountLabel).toContain("60,000");
  });

  it("결근한 날은 금액 자리가 비고 결근이라 적는다", () => {
    reads({ data: [day("2026-10-09", 0, "absent")] });

    const { result } = renderHook(() =>
      usePayrollHistoryRows(SPAN, PROFILE_ID),
    );

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.rows[0].subtitle).toBe("결근");
  });

  it("읽는 중에는 pending이다", () => {
    reads({ isLoading: true });

    const { result } = renderHook(() =>
      usePayrollHistoryRows(SPAN, PROFILE_ID),
    );

    expect(result.current.state).toBe("pending");
  });

  it("읽기가 넘어지면 failed고 다시 시도할 손이 있다", () => {
    reads({ error: new Error("끊겼다") });

    const { result } = renderHook(() =>
      usePayrollHistoryRows(SPAN, PROFILE_ID),
    );

    expect(result.current.state).toBe("failed");

    if (result.current.state !== "failed") {
      throw new Error("failed가 아니다");
    }

    result.current.retry();

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("받은 profileId를 그대로 service에 넘긴다", () => {
    reads({ data: [] });

    renderHook(() => usePayrollHistoryRows(SPAN, PROFILE_ID));

    expect(useMyPayrollViewDaysQueryMock).toHaveBeenCalledWith(
      expect.anything(),
      SPAN,
      expect.any(Number),
      PROFILE_ID,
    );
  });
});
