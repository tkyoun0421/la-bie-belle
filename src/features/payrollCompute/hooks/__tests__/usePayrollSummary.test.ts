import { jest } from "@jest/globals";
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
const { usePayrollSummary } =
  await import("@/features/payrollCompute/hooks/usePayrollSummary");

const SPAN = { from: "2026-10-01", to: "2026-10-31" };
const PROFILE_ID = "me";

const refetch = jest.fn();

function day(amount: number): PayrollViewDay {
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

describe("usePayrollSummary — 조각이 자기 금액을 완성해 든다", () => {
  it("불러온 날의 금액을 합쳐 문안으로 낸다", () => {
    reads({ data: [day(50000), day(30000)] });

    const { result } = renderHook(() => usePayrollSummary(SPAN, PROFILE_ID));

    expect(result.current.state).toBe("ready");

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.amountLabel).toContain("80,000");
  });

  it("예상치라는 안내를 같이 든다", () => {
    reads({ data: [day(50000)] });

    const { result } = renderHook(() => usePayrollSummary(SPAN, PROFILE_ID));

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.estimateNote).toContain("예상치");
  });

  it("근무가 없어도 금액 자리가 빈 채로 선다", () => {
    reads({ data: [] });

    const { result } = renderHook(() => usePayrollSummary(SPAN, PROFILE_ID));

    expect(result.current.state).toBe("ready");

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.amountLabel).toBeTruthy();
  });

  it("읽는 중에는 pending이다", () => {
    reads({ isLoading: true });

    const { result } = renderHook(() => usePayrollSummary(SPAN, PROFILE_ID));

    expect(result.current.state).toBe("pending");
  });

  it("읽기가 넘어지면 failed고 다시 시도할 손이 있다", () => {
    reads({ error: new Error("끊겼다") });

    const { result } = renderHook(() => usePayrollSummary(SPAN, PROFILE_ID));

    expect(result.current.state).toBe("failed");

    if (result.current.state !== "failed") {
      throw new Error("failed가 아니다");
    }

    result.current.retry();

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("받은 구간을 그대로 service에 넘긴다", () => {
    reads({ data: [] });

    renderHook(() => usePayrollSummary(SPAN, PROFILE_ID));

    expect(useMyPayrollViewDaysQueryMock).toHaveBeenCalledWith(
      expect.anything(),
      SPAN,
      expect.any(Number),
      PROFILE_ID,
    );
  });
});
