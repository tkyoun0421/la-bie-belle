import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const listActiveMembersMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getWageRatesMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

const TODAY = "2026-10-03";

const FAKE_CLIENT = {} as never;

const backMock = jest.fn();
const replaceMock = jest.fn();
const canGoBackMock = jest.fn<() => boolean>();

jest.unstable_mockModule("expo-router", () => ({
  useRouter: () => ({
    back: backMock,
    replace: replaceMock,
    canGoBack: canGoBackMock,
  }),
}));

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule("@/entities/member/api/listMembers.api", () => ({
  listActiveMembers: listActiveMembersMock,
  listBlockedMembers: jest.fn(),
  listLeftMembers: jest.fn(),
  listPendingMembers: jest.fn(),
}));

jest.unstable_mockModule("@/entities/payroll/api/getWageRates.api", () => ({
  getWageRates: getWageRatesMock,
}));

jest.unstable_mockModule("@/shared/lib/kstToday.lib", () => ({
  kstToday: () => TODAY,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { WAGES_COPY } = await import("@/screens/wages/consts/wages.const");
const { useWagesScreen } = await import("@/screens/wages/hooks/useWagesScreen");
const { ADMIN_HOME_PATH } = await import("@/shared/consts/navigation.const");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
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

const MEMBERS = [
  { id: "p1", displayName: "이준호", photoUrl: null },
  { id: "p2", displayName: "박수진", photoUrl: null },
];

function rate(
  profileId: string,
  amount: number,
  followsDefault: boolean,
  effectiveDate = "2026-09-01",
) {
  return {
    profileId,
    effectiveDate,
    amount,
    followsDefault,
  };
}

beforeEach(() => {
  listActiveMembersMock.mockReset();
  getWageRatesMock.mockReset();
  backMock.mockClear();
  replaceMock.mockClear();
  canGoBackMock.mockReset();
  canGoBackMock.mockReturnValue(true);

  listActiveMembersMock.mockResolvedValue(MEMBERS);
  getWageRatesMock.mockResolvedValue({
    wageRates: [
      rate("p1", 11000, true),
      rate("p2", 13000, false, "2026-06-01"),
      rate("p2", 15000, false),
    ],
    defaultWageRate: { amount: 11000 },
  });
});

async function mounted() {
  const { wrapper } = createWrapper();
  const hook = renderHook(() => useWagesScreen(), { wrapper });

  await waitFor(() =>
    expect(hook.result.current.listState).not.toBe("loading"),
  );

  return hook;
}

describe("useWagesScreen — 목록과 시트 고르는 자리를 든다", () => {
  it("읽기 전에는 loading이다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useWagesScreen(), {
      wrapper,
    });

    expect(result.current.listState).toBe("loading");
  });

  it("승인된 사람이 없으면 empty다", async () => {
    listActiveMembersMock.mockResolvedValue([]);

    const { result } = await mounted();

    expect(result.current.listState).toBe("empty");
  });

  it("기본 시급 줄이 지금 값과 쓰는 사람 수를 말한다", async () => {
    const { result } = await mounted();

    expect(result.current.baseValue).toContain("11,000");
    expect(result.current.baseNote).toContain("1");
  });

  it("기본 시급이 없으면 정하라고 말한다", async () => {
    getWageRatesMock.mockResolvedValue({
      wageRates: [],
      defaultWageRate: null,
    });

    const { result } = await mounted();

    expect(result.current.baseValue).toBe(WAGES_COPY.noBase);
    expect(result.current.hasDefaultWage).toBe(false);
  });

  it("줄이 사람마다 제 시급을 말하고 기본을 따르는 사람도 금액이 선다", async () => {
    const { result } = await mounted();

    expect(result.current.listState).toBe("rows");
    expect(result.current.rows).toHaveLength(2);
    expect(result.current.rows[0].valueLabel).toContain("11,000");
  });

  it("기본 시트를 열면 그 시트가 쓸 값이 실린다", async () => {
    const { result } = await mounted();

    act(() => result.current.openBase());

    expect(result.current.sheet).toBe("default");
    expect(result.current.defaultWage).toBe(11000);
    expect(result.current.followerCount).toBe(1);
  });

  it("사람 시트를 열면 그 사람과 그 사람 시급 줄이 실린다", async () => {
    const { result } = await mounted();

    act(() => result.current.rows[1].press());

    expect(result.current.sheet).toBe("member");
    expect(result.current.member?.profileId).toBe("p2");
    expect(result.current.member?.displayName).toBe("박수진");
    expect(result.current.member?.rates).toHaveLength(2);
  });

  it("시트를 닫으면 걷힌다", async () => {
    const { result } = await mounted();

    act(() => result.current.rows[1].press());
    act(() => result.current.close());

    expect(result.current.sheet).toBeNull();
    expect(result.current.member).toBeNull();
  });

  it("끝났다고 받으면 토스트가 서고 시트가 닫힌다", async () => {
    const { result } = await mounted();

    act(() => result.current.openBase());
    act(() => result.current.finish("기본 시급을 바꿨어요"));

    expect(result.current.toast).toBe("기본 시급을 바꿨어요");
    expect(result.current.sheet).toBeNull();

    act(() => result.current.dismissToast());

    expect(result.current.toast).toBeNull();
  });
});

describe("useWagesScreen — 갈 데를 controller가 정한다", () => {
  it("돌아갈 데가 있으면 뒤로 간다", async () => {
    const { result } = await mounted();

    act(() => result.current.goBack());

    expect(backMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("돌아갈 데가 없으면 관리자 홈으로 바꿔 넣는다", async () => {
    canGoBackMock.mockReturnValue(false);

    const { result } = await mounted();

    act(() => result.current.goBack());

    expect(replaceMock).toHaveBeenCalledWith(ADMIN_HOME_PATH);
    expect(backMock).not.toHaveBeenCalled();
  });
});
