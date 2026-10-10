import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const setWageMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const resetWageToDefaultMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const TODAY = "2026-10-03";

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule("@/features/wageAdmin/api/setWage.api", () => ({
  setWage: setWageMock,
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
const { WAGE_SHEET_COPY, WAGE_SAVE_FAILED_TITLE } =
  await import("@/features/wageAdmin/consts/wageAdmin.const");
const { useMemberWageSheet } =
  await import("@/features/wageAdmin/hooks/useMemberWageSheet");

function rate(
  amount: number,
  followsDefault: boolean,
  effectiveDate = "2026-09-01",
) {
  return { profileId: "p2", effectiveDate, amount, followsDefault };
}

const OWN_RATES = [rate(13000, false, "2026-06-01"), rate(15000, false)];

const FOLLOWING_RATES = [rate(11000, true)];

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

function sheetFor(
  input: {
    rates?: typeof OWN_RATES;
    hasDefaultWage?: boolean;
    defaultWage?: number | null;
    onDone?: (message: string) => void;
  } = {},
) {
  const { wrapper } = createWrapper();

  return renderHook(
    () =>
      useMemberWageSheet({
        profileId: "p2",
        name: "박수진",
        photoUrl: null,
        rates: input.rates ?? OWN_RATES,
        hasDefaultWage: input.hasDefaultWage ?? true,
        defaultWage: input.defaultWage ?? 11000,
        onDone: input.onDone ?? jest.fn(),
      }),
    { wrapper },
  );
}

beforeEach(() => {
  setWageMock.mockReset();
  resetWageToDefaultMock.mockReset();
  setWageMock.mockResolvedValue(undefined);
  resetWageToDefaultMock.mockResolvedValue(undefined);
});

describe("useMemberWageSheet — 조각이 사람 시급 쓰기를 든다", () => {
  it("열리면 그 사람 이력과 지금 값이 실린다", () => {
    const { result } = sheetFor();

    expect(result.current.name).toBe("박수진");
    expect(result.current.amountText).toBe("15,000");
    expect(result.current.historyRows.map((row) => row.amountLabel)).toEqual([
      "15,000원",
      "13,000원",
    ]);
    expect(result.current.historyHasMore).toBe(false);
  });

  it("줄이 하나뿐인 사람은 이력을 안 그린다", () => {
    const { result } = sheetFor({ rates: FOLLOWING_RATES });

    expect(result.current.historyRows).toEqual([]);
  });

  it("시급을 저장하면 그 사람 id로 간다", async () => {
    const onDone = jest.fn();
    const { result } = sheetFor({ onDone });

    act(() => result.current.write("16000"));
    act(() => result.current.save());

    await waitFor(() =>
      expect(setWageMock).toHaveBeenCalledWith(FAKE_CLIENT, {
        profileId: "p2",
        amount: 16000,
      }),
    );
    await waitFor(() =>
      expect(onDone).toHaveBeenCalledWith(WAGE_SHEET_COPY.wageChanged),
    );
  });

  it("되돌리기는 확인을 받고 그 사람 id로 간다", async () => {
    const onDone = jest.fn();
    const { result } = sheetFor({ onDone });

    expect(result.current.canReset).toBe(true);

    act(() => result.current.askReset());

    expect(result.current.asking).toBe(true);

    act(() => result.current.confirmReset());

    await waitFor(() =>
      expect(resetWageToDefaultMock).toHaveBeenCalledWith(FAKE_CLIENT, "p2"),
    );
    await waitFor(() =>
      expect(onDone).toHaveBeenCalledWith(WAGE_SHEET_COPY.resetDone),
    );
  });

  it("기본을 따르는 사람에게는 되돌리기가 없다", () => {
    const { result } = sheetFor({ rates: FOLLOWING_RATES });

    expect(result.current.canReset).toBe(false);
  });

  it("되돌리기가 기본 시급이 없어 거절당하면 그 말을 한다", async () => {
    resetWageToDefaultMock.mockRejectedValue(
      new DomainError("no_default_wage"),
    );

    const { result } = sheetFor();

    act(() => result.current.askReset());
    act(() => result.current.confirmReset());

    await waitFor(() =>
      expect(result.current.resetNotice).toBe(
        WAGE_SHEET_COPY.noDefaultWageNotice,
      ),
    );

    expect(result.current.asking).toBe(true);
  });

  it("통신이 끊긴 것은 그 말을 안 한다", async () => {
    resetWageToDefaultMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = sheetFor();

    act(() => result.current.askReset());
    act(() => result.current.confirmReset());

    await waitFor(() => expect(result.current.asking).toBe(true));

    expect(result.current.resetNotice).toBeUndefined();
  });

  it("확인창을 닫으면 거절 안내도 걷힌다", async () => {
    resetWageToDefaultMock.mockRejectedValue(
      new DomainError("no_default_wage"),
    );

    const { result } = sheetFor();

    act(() => result.current.askReset());
    act(() => result.current.confirmReset());

    await waitFor(() => expect(result.current.resetNotice).toBeDefined());

    act(() => result.current.cancelReset());

    expect(result.current.asking).toBe(false);
    expect(result.current.resetNotice).toBeUndefined();
  });

  it("되돌릴 기본 시급을 글월에 담는다", () => {
    const { result } = sheetFor();

    expect(result.current.resetBody).toContain("11,000");
  });

  it("저장이 넘어지면 넣은 값이 남고 끝났다고 알리지 않는다", async () => {
    setWageMock.mockRejectedValue(new Error("끊겼다"));

    const onDone = jest.fn();
    const { result } = sheetFor({ onDone });

    act(() => result.current.write("16000"));
    act(() => result.current.save());

    await waitFor(() => expect(result.current.failed).toBe(true));

    expect(result.current.amountText).toBe("16,000");
    expect(onDone).not.toHaveBeenCalled();
  });
});

describe("useMemberWageSheet — 실패 문안을 controller가 완성해 내려준다", () => {
  it("저장이 넘어지면 failedLine이 그 슬라이스의 문안과 같다", async () => {
    setWageMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = sheetFor();

    act(() => result.current.write("16000"));
    act(() => result.current.save());

    await waitFor(() => {
      expect(result.current.failedLine).toBe(WAGE_SAVE_FAILED_TITLE);
    });
  });

  it("failedLine이 빈 글자가 아니다", async () => {
    setWageMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = sheetFor();

    act(() => result.current.write("16000"));
    act(() => result.current.save());

    await waitFor(() => expect(result.current.failed).toBe(true));

    expect(result.current.failedLine).toBeTruthy();
  });
});
