import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getHallDefaultsMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/hall/api/getHallDefaults.api", () => ({
  getHallDefaults: getHallDefaultsMock,
}));

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useHallDefaultsQuery } =
  await import("@/entities/hall/services/useHallDefaultsQuery");

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

  return { wrapper, queryClient };
}

const FAKE_CLIENT = {} as never;

const HALL_DEFAULTS = {
  slots: [{ positions: ["팀장"], count: 1 }],
  starts: "10:00",
  ends: "19:00",
};

beforeEach(() => {
  getHallDefaultsMock.mockReset();
});

describe("useHallDefaultsQuery — getHallDefaults를 불러 ['hall']에 앉힌다", () => {
  it("client를 그대로 넘겨 DAL을 부른다", async () => {
    getHallDefaultsMock.mockResolvedValue(HALL_DEFAULTS);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useHallDefaultsQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getHallDefaultsMock).toHaveBeenCalledWith(FAKE_CLIENT);
  });

  it("아직 응답이 없으면 isLoading이 참이다", () => {
    getHallDefaultsMock.mockReturnValue(new Promise(() => {}));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useHallDefaultsQuery(FAKE_CLIENT), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("응답하면 기본값을 그대로 낸다", async () => {
    getHallDefaultsMock.mockResolvedValue(HALL_DEFAULTS);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useHallDefaultsQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(HALL_DEFAULTS);
  });

  it("DAL이 실패하면 error를 낸다", async () => {
    getHallDefaultsMock.mockRejectedValue(new Error("통신이 끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useHallDefaultsQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("캐시 키는 ['hall']이다", async () => {
    getHallDefaultsMock.mockResolvedValue(HALL_DEFAULTS);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useHallDefaultsQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["hall"])).toEqual(HALL_DEFAULTS);
  });
});
