import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const setDefaultWageMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule("@/features/wageAdmin/api/setDefaultWage.api", () => ({
  setDefaultWage: setDefaultWageMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { WAGE_SHEET_COPY, WAGE_SAVE_FAILED_TITLE } =
  await import("@/features/wageAdmin/consts/wageAdmin.const");
const { useDefaultWageSheet } =
  await import("@/features/wageAdmin/hooks/useDefaultWageSheet");

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
    defaultWage?: number | null;
    followerCount?: number;
    onDone?: (message: string) => void;
  } = {},
) {
  const { wrapper } = createWrapper();

  return renderHook(
    () =>
      useDefaultWageSheet({
        defaultWage: input.defaultWage ?? 11000,
        followerCount: input.followerCount ?? 1,
        onDone: input.onDone ?? jest.fn(),
      }),
    { wrapper },
  );
}

beforeEach(() => {
  setDefaultWageMock.mockReset();
  setDefaultWageMock.mockResolvedValue(undefined);
});

describe("useDefaultWageSheet — 조각이 기본 시급 쓰기를 든다", () => {
  it("열리면 지금 값이 칸에 채워진다", () => {
    const { result } = sheetFor();

    expect(result.current.amountText).toBe("11,000");
    expect(result.current.canSave).toBe(false);
  });

  it("쓰는 사람 수를 글월로 든다", () => {
    expect(sheetFor({ followerCount: 0 }).result.current.followerLine).toBe(
      WAGE_SHEET_COPY.noFollower,
    );
    expect(
      sheetFor({ followerCount: 3 }).result.current.followerLine,
    ).toContain("3");
  });

  it("값을 바꾸면 저장이 눌리고 바꾼 값이 간다", async () => {
    const onDone = jest.fn();
    const { result } = sheetFor({ onDone });

    act(() => result.current.write("12000"));

    expect(result.current.amountText).toBe("12,000");
    expect(result.current.canSave).toBe(true);

    act(() => result.current.save());

    await waitFor(() =>
      expect(setDefaultWageMock).toHaveBeenCalledWith(FAKE_CLIENT, 12000),
    );
    await waitFor(() =>
      expect(onDone).toHaveBeenCalledWith(WAGE_SHEET_COPY.defaultChanged),
    );
  });

  it("상한을 넘기면 이전 값이 남고 상한에 닿으면 안내가 선다", () => {
    const { result } = sheetFor();

    act(() => result.current.write("100000"));

    expect(result.current.capHint).toBeTruthy();

    act(() => result.current.write("1000000"));

    expect(result.current.amountText).toBe("100,000");
  });

  it("저장이 넘어지면 넣은 값이 남고 끝났다고 알리지 않는다", async () => {
    setDefaultWageMock.mockRejectedValue(new Error("끊겼다"));

    const onDone = jest.fn();
    const { result } = sheetFor({ onDone });

    act(() => result.current.write("12000"));
    act(() => result.current.save());

    await waitFor(() => expect(result.current.failedLine).not.toBeNull());

    expect(result.current.amountText).toBe("12,000");
    expect(onDone).not.toHaveBeenCalled();
  });
});

describe("useDefaultWageSheet — 실패 문안을 controller가 완성해 내려준다", () => {
  it("저장이 넘어지면 failedLine이 그 슬라이스의 문안과 같다", async () => {
    setDefaultWageMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = sheetFor();

    act(() => result.current.write("12000"));
    act(() => result.current.save());

    await waitFor(() => {
      expect(result.current.failedLine).toBe(WAGE_SAVE_FAILED_TITLE);
    });
  });

  it("failedLine이 빈 글자가 아니다", async () => {
    setDefaultWageMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = sheetFor();

    act(() => result.current.write("12000"));
    act(() => result.current.save());

    await waitFor(() => expect(result.current.failedLine).not.toBeNull());

    expect(result.current.failedLine).toBeTruthy();
  });
});
