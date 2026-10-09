import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const setDayHoursMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/features/scheduleDay/api/setDayHours.api", () => ({
  setDayHours: setDayHoursMock,
}));

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useDayHoursSheet } =
  await import("@/features/scheduleDay/hooks/useDayHoursSheet");

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

function mount(onDone: () => void = jest.fn()) {
  const { wrapper } = createWrapper();

  return renderHook(
    () =>
      useDayHoursSheet({
        workDate: "2026-10-10",
        startsAt: "10:00:00",
        endsAt: "18:00:00",
        onDone,
      }),
    { wrapper },
  );
}

beforeEach(() => {
  setDayHoursMock.mockReset();
  setDayHoursMock.mockResolvedValue(undefined);
});

describe("useDayHoursSheet — 그 날의 시각으로 칸을 채우고 초를 뗀다", () => {
  it("받은 출근·퇴근이 분까지만 칸에 선다", () => {
    const { result } = mount();

    expect(result.current.starts).toBe("10:00");
    expect(result.current.ends).toBe("18:00");
    expect(result.current.canSave).toBe(true);
    expect(result.current.failedLine).toBeNull();
  });

  it("적으면 칸이 따라간다", () => {
    const { result } = mount();

    act(() => result.current.writeStarts("11:00"));
    act(() => result.current.writeEnds("19:00"));

    expect(result.current.starts).toBe("11:00");
    expect(result.current.ends).toBe("19:00");
  });

  it("퇴근이 출근보다 이르면 못 보낸다", () => {
    const { result } = mount();

    act(() => result.current.writeEnds("09:00"));

    expect(result.current.canSave).toBe(false);
  });
});

describe("useDayHoursSheet — 조각이 자기 mutation을 부른다", () => {
  it("그 날과 적은 시각이 실려 간다", async () => {
    const { result } = mount();

    act(() => result.current.writeStarts("11:00"));
    act(() => result.current.writeEnds("19:00"));
    act(() => result.current.save());

    await waitFor(() =>
      expect(setDayHoursMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        "2026-10-10",
        "11:00",
        "19:00",
      ),
    );
  });

  it("성공하면 끝났다고 알린다", async () => {
    const onDone = jest.fn();
    const { result } = mount(onDone);

    act(() => result.current.save());

    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });

  it("실패하면 그 줄이 선다", async () => {
    setDayHoursMock.mockRejectedValue(new Error("못 바꿨다"));

    const { result } = mount();

    act(() => result.current.save());

    await waitFor(() => expect(result.current.failedLine).not.toBeNull());
  });
});
