import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const listActiveMembersMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getWageRatesMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const setWageMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const setDefaultWageMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const resetWageToDefaultMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const TODAY = "2026-10-03";

const FAKE_CLIENT = {} as never;

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

jest.unstable_mockModule("@/features/wageAdmin/api/setWage.api", () => ({
  setWage: setWageMock,
}));

jest.unstable_mockModule("@/features/wageAdmin/api/setDefaultWage.api", () => ({
  setDefaultWage: setDefaultWageMock,
}));

jest.unstable_mockModule(
  "@/features/wageAdmin/api/resetWageToDefault.api",
  () => ({ resetWageToDefault: resetWageToDefaultMock }),
);

jest.unstable_mockModule("@/shared/lib/kstToday.lib", () => ({
  kstToday: () => TODAY,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { WAGES_COPY } = await import("@/screens/wages/consts/wages.const");
const { useWagesScreen } = await import("@/screens/wages/hooks/useWagesScreen");

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
  { id: "p1", display_name: "이준호", photo_url: null },
  { id: "p2", display_name: "박수진", photo_url: null },
];

function rate(
  profileId: string,
  amount: number,
  followsDefault: boolean,
  effectiveDate = "2026-09-01",
) {
  return {
    profile_id: profileId,
    effective_date: effectiveDate,
    amount,
    follows_default: followsDefault,
  };
}

beforeEach(() => {
  listActiveMembersMock.mockReset();
  getWageRatesMock.mockReset();
  setWageMock.mockReset();
  setDefaultWageMock.mockReset();
  resetWageToDefaultMock.mockReset();

  listActiveMembersMock.mockResolvedValue(MEMBERS);
  getWageRatesMock.mockResolvedValue({
    wageRates: [
      rate("p1", 11000, true),
      rate("p2", 13000, false, "2026-06-01"),
      rate("p2", 15000, false),
    ],
    defaultWageRate: { amount: 11000 },
  });
  setWageMock.mockResolvedValue(undefined);
  setDefaultWageMock.mockResolvedValue(undefined);
  resetWageToDefaultMock.mockResolvedValue(undefined);
});

async function mounted() {
  const { wrapper } = createWrapper();
  const hook = renderHook(() => useWagesScreen(), { wrapper });

  await waitFor(() =>
    expect(hook.result.current.listState).not.toBe("loading"),
  );

  return hook;
}

describe("useWagesScreen — 금액 칸 하나를 시트 둘이 같이 쓴다", () => {
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

  it("기본 시트를 열면 지금 값이 칸에 채워진다", async () => {
    const { result } = await mounted();

    act(() => result.current.openBase());

    expect(result.current.sheet).toBe("default");
    expect(result.current.amountText).toBe("11,000");
    expect(result.current.canSave).toBe(false);
  });

  it("값을 바꾸면 저장이 눌린다", async () => {
    const { result } = await mounted();

    act(() => result.current.openBase());
    act(() => result.current.write("12000"));

    expect(result.current.amountText).toBe("12,000");
    expect(result.current.canSave).toBe(true);

    act(() => result.current.save());

    await waitFor(() =>
      expect(setDefaultWageMock).toHaveBeenCalledWith(FAKE_CLIENT, 12000),
    );
    await waitFor(() =>
      expect(result.current.toast).toBe(WAGES_COPY.defaultChanged),
    );

    expect(result.current.sheet).toBeNull();
  });

  it("상한을 넘기면 이전 값이 남고 상한에 닿으면 안내가 선다", async () => {
    const { result } = await mounted();

    act(() => result.current.openBase());
    act(() => result.current.write("100000"));

    expect(result.current.capHint).toBeTruthy();

    act(() => result.current.write("1000000"));

    expect(result.current.amountText).toBe("100,000");
  });

  it("사람 시트를 열면 그 사람 이력과 지금 값이 실린다", async () => {
    const { result } = await mounted();

    act(() => result.current.rows[1].press());

    expect(result.current.sheet).toBe("member");
    expect(result.current.member?.displayName).toBe("박수진");
    expect(result.current.amountText).toBe("15,000");
    expect(result.current.historyRows.map((row) => row.amountLabel)).toEqual([
      "15,000원",
      "13,000원",
    ]);
    expect(result.current.historyHasMore).toBe(false);
  });

  it("줄이 하나뿐인 사람은 이력을 안 그린다", async () => {
    const { result } = await mounted();

    act(() => result.current.rows[0].press());

    expect(result.current.historyRows).toEqual([]);
  });

  it("사람 시급을 저장하면 그 사람 id로 간다", async () => {
    const { result } = await mounted();

    act(() => result.current.rows[1].press());
    act(() => result.current.write("16000"));
    act(() => result.current.save());

    await waitFor(() =>
      expect(setWageMock).toHaveBeenCalledWith(FAKE_CLIENT, {
        profileId: "p2",
        amount: 16000,
      }),
    );
    await waitFor(() =>
      expect(result.current.toast).toBe(WAGES_COPY.wageChanged),
    );
  });

  it("되돌리기는 확인을 받고 그 사람 id로 간다", async () => {
    const { result } = await mounted();

    act(() => result.current.rows[1].press());

    expect(result.current.canReset).toBe(true);

    act(() => result.current.askReset());

    expect(result.current.asking).toBe(true);

    act(() => result.current.confirmReset());

    await waitFor(() =>
      expect(resetWageToDefaultMock).toHaveBeenCalledWith(FAKE_CLIENT, "p2"),
    );
    await waitFor(() =>
      expect(result.current.toast).toBe(WAGES_COPY.resetDone),
    );

    expect(result.current.asking).toBe(false);
    expect(result.current.sheet).toBeNull();
  });

  it("기본을 따르는 사람에게는 되돌리기가 없다", async () => {
    const { result } = await mounted();

    act(() => result.current.rows[0].press());

    expect(result.current.canReset).toBe(false);
  });

  it("되돌리기가 기본 시급이 없어 거절당하면 그 말을 한다", async () => {
    resetWageToDefaultMock.mockRejectedValue(
      new DomainError("no_default_wage"),
    );

    const { result } = await mounted();

    act(() => result.current.rows[1].press());
    act(() => result.current.askReset());
    act(() => result.current.confirmReset());

    await waitFor(() =>
      expect(result.current.resetNotice).toBe(WAGES_COPY.noDefaultWageNotice),
    );

    expect(result.current.asking).toBe(true);
  });

  it("통신이 끊긴 것은 그 말을 안 한다", async () => {
    resetWageToDefaultMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted();

    act(() => result.current.rows[1].press());
    act(() => result.current.askReset());
    act(() => result.current.confirmReset());

    await waitFor(() => expect(result.current.asking).toBe(true));

    expect(result.current.resetNotice).toBeUndefined();
  });

  it("저장이 넘어지면 시트가 열린 채로 넣은 값이 남는다", async () => {
    setDefaultWageMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted();

    act(() => result.current.openBase());
    act(() => result.current.write("12000"));
    act(() => result.current.save());

    await waitFor(() => expect(result.current.failed).toBe(true));

    expect(result.current.sheet).toBe("default");
    expect(result.current.amountText).toBe("12,000");
  });

  it("시트를 닫으면 넣은 값과 확인창이 처음으로 돌아간다", async () => {
    const { result } = await mounted();

    act(() => result.current.rows[1].press());
    act(() => result.current.write("16000"));
    act(() => result.current.askReset());
    act(() => result.current.close());

    expect(result.current.sheet).toBeNull();
    expect(result.current.asking).toBe(false);
    expect(result.current.amountText).toBe("");
  });

  it("토스트를 치우면 사라진다", async () => {
    const { result } = await mounted();

    act(() => result.current.openBase());
    act(() => result.current.write("12000"));
    act(() => result.current.save());

    await waitFor(() => expect(result.current.toast).not.toBeNull());

    act(() => result.current.dismissToast());

    expect(result.current.toast).toBeNull();
  });
});
