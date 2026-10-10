import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getWageRatesMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: {} as never,
}));

jest.unstable_mockModule("@/entities/payroll/api/getWageRates.api", () => ({
  getWageRates: getWageRatesMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { NO_VALUE } = await import("@/shared/consts/noValue.const");
const { useWageRows } = await import("@/entities/payroll/hooks/useWageRows");

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

  return { wrapper };
}

const PEOPLE = [
  { profileId: "p1", displayName: "이준호", photoUrl: null },
  { profileId: "p2", displayName: "박수진", photoUrl: null },
];

function rate(
  profileId: string,
  amount: number,
  followsDefault: boolean,
  effectiveDate = "2026-09-01",
) {
  return { profileId, effectiveDate, amount, followsDefault };
}

const onPressPerson = jest.fn<(profileId: string) => void>();

beforeEach(() => {
  getWageRatesMock.mockReset();
  onPressPerson.mockReset();

  getWageRatesMock.mockResolvedValue({
    wageRates: [
      rate("p1", 11000, true),
      rate("p2", 13000, false, "2026-06-01"),
      rate("p2", 15000, false),
    ],
    defaultWageRate: { amount: 11000 },
  });
});

async function mounted(people: typeof PEOPLE = PEOPLE) {
  const { wrapper } = createWrapper();
  const hook = renderHook(() => useWageRows({ people, onPressPerson }), {
    wrapper,
  });

  await waitFor(() => expect(hook.result.current.state).not.toBe("pending"));

  return hook;
}

describe("useWageRows — 조각이 자기 시급을 불러 줄을 완성한다", () => {
  it("받은 사람마다 줄이 서고 기본을 따르는 사람도 금액이 선다", async () => {
    const { result } = await mounted();

    expect(result.current.state).toBe("ready");

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.rows).toHaveLength(2);
    expect(result.current.rows[0].valueLabel).toContain("11,000");
  });

  it("시급이 여러 번 바뀐 사람은 가장 늦은 값을 말한다", async () => {
    const { result } = await mounted();

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.rows[1].valueLabel).toContain("15,000");
  });

  it("시급이 없는 사람은 금액 자리가 빈다", async () => {
    const { result } = await mounted([
      { profileId: "p3", displayName: "최은영", photoUrl: null },
    ]);

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.rows[0].valueLabel).toBe(NO_VALUE);
  });

  it("사람이 그린 이름과 사진을 그대로 든다", async () => {
    const { result } = await mounted();

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.rows[1].displayName).toBe("박수진");
    expect(result.current.rows[1].photoUrl).toBeNull();
  });

  it("읽는 중에는 pending이다", () => {
    getWageRatesMock.mockImplementation(() => new Promise(() => {}));

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useWageRows({ people: PEOPLE, onPressPerson }),
      { wrapper },
    );

    expect(result.current.state).toBe("pending");
  });

  it("읽기가 넘어지면 failed다", async () => {
    getWageRatesMock.mockRejectedValue(new Error("끊겼어요"));

    const { result } = await mounted();

    expect(result.current.state).toBe("failed");
  });

  it("줄을 누르면 누른 사람을 받은 쪽에 넘긴다", async () => {
    const { result } = await mounted();

    const fragment = result.current;

    if (fragment.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    act(() => fragment.rows[1].press());

    expect(onPressPerson).toHaveBeenCalledWith("p2");
  });
});
