import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const setHallDefaultsMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule(
  "@/features/hallDefaults/api/setHallDefaults.api",
  () => ({ setHallDefaults: setHallDefaultsMock }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { HALL_DEFAULTS_COPY } =
  await import("@/features/hallDefaults/consts/hallDefaults.const");
const { useHallDefaultsSheet } =
  await import("@/features/hallDefaults/hooks/useHallDefaultsSheet");

const SLOTS = [{ positions: ["바"], count: 2 }];

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

function sheetFor(onSaved = jest.fn()) {
  const { wrapper } = createWrapper();

  return renderHook(
    () =>
      useHallDefaultsSheet({
        starts: "10:00",
        ends: "19:00",
        slots: SLOTS,
        onSaved,
      }),
    { wrapper },
  );
}

beforeEach(() => {
  setHallDefaultsMock.mockReset();
  setHallDefaultsMock.mockResolvedValue(undefined);
});

describe("useHallDefaultsSheet — 조각이 기본값 쓰기를 든다", () => {
  it("받은 기본값이 칸에 채워져 있다", () => {
    const { result } = sheetFor();

    expect(result.current.starts).toBe("10:00");
    expect(result.current.ends).toBe("19:00");
  });

  it("고친 값을 보내면 자리 수는 그대로 간다", async () => {
    const { result } = sheetFor();

    act(() => result.current.writeStarts("11:00"));
    act(() => result.current.writeEnds("20:00"));

    expect(result.current.starts).toBe("11:00");

    act(() => result.current.save());

    await waitFor(() =>
      expect(setHallDefaultsMock).toHaveBeenCalledWith(FAKE_CLIENT, {
        slots: SLOTS,
        starts: "11:00",
        ends: "20:00",
      }),
    );
  });

  it("보내고 나면 끝났다고 알린다", async () => {
    const onSaved = jest.fn();
    const { result } = sheetFor(onSaved);

    act(() => result.current.save());

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
  });

  it("보내기가 넘어지면 적은 값이 남고 끝났다고 알리지 않는다", async () => {
    setHallDefaultsMock.mockRejectedValue(new Error("끊겼다"));

    const onSaved = jest.fn();
    const { result } = sheetFor(onSaved);

    act(() => result.current.writeStarts("11:00"));
    act(() => result.current.save());

    await waitFor(() => expect(result.current.failedLine).not.toBeNull());

    expect(result.current.starts).toBe("11:00");
    expect(onSaved).not.toHaveBeenCalled();
  });
});

describe("useHallDefaultsSheet — 실패 문안을 controller가 완성해 내려준다", () => {
  it("보내기가 넘어지면 failedLine이 그 슬라이스의 문안과 같다", async () => {
    setHallDefaultsMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = sheetFor();

    act(() => result.current.save());

    await waitFor(() => {
      expect(result.current.failedLine).toBe(HALL_DEFAULTS_COPY.saveFailed);
    });
  });

  it("failedLine이 빈 글자가 아니다", async () => {
    setHallDefaultsMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = sheetFor();

    act(() => result.current.save());

    await waitFor(() => expect(result.current.failedLine).not.toBeNull());

    expect(result.current.failedLine).toBeTruthy();
  });
});
