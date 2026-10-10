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

  return { wrapper, queryClient };
}

function mount(onDone: () => void = jest.fn()) {
  const { wrapper, queryClient } = createWrapper();

  const rendered = renderHook(
    () =>
      useDayHoursSheet({
        workDate: "2026-10-10",
        startsAt: "10:00:00",
        endsAt: "18:00:00",
        onDone,
      }),
    { wrapper },
  );

  return { ...rendered, queryClient };
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

describe("useDayHoursSheet — 시트는 무효화가 다 끝난 뒤에 닫힌다", () => {
  function mountWithDeferredInvalidate(onDone: () => void) {
    const { result, queryClient } = mount(onDone);
    const resolvers: Array<() => void> = [];

    jest.spyOn(queryClient, "invalidateQueries").mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvers.push(resolve);
        }),
    );

    act(() => result.current.save());

    return { result, resolvers };
  }

  it("무효화가 하나도 끝나지 않았으면 끝났다고 알리지 않는다", async () => {
    const onDone = jest.fn();
    const { resolvers } = mountWithDeferredInvalidate(onDone);

    await waitFor(() => expect(resolvers).toHaveLength(3));

    expect(onDone).not.toHaveBeenCalled();
  });

  it("무효화 셋 가운데 하나만 끝나면 아직 끝났다고 알리지 않는다", async () => {
    const onDone = jest.fn();
    const { resolvers } = mountWithDeferredInvalidate(onDone);

    await waitFor(() => expect(resolvers).toHaveLength(3));

    await act(async () => {
      resolvers[0]?.();
    });

    expect(onDone).not.toHaveBeenCalled();
  });

  it("무효화 셋이 모두 끝나야 끝났다고 알린다", async () => {
    const onDone = jest.fn();
    const { resolvers } = mountWithDeferredInvalidate(onDone);

    await waitFor(() => expect(resolvers).toHaveLength(3));

    await act(async () => {
      resolvers.forEach((resolve) => resolve());
    });

    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });
});
