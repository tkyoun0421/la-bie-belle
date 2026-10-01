import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getMonthWindowMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/entities/schedule/api/getMonthSchedule.api",
  () => ({
    getMonthWindow: getMonthWindowMock,
  }),
);

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useMonthWindowQuery } =
  await import("@/entities/schedule/services/useMonthWindowQuery");

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

const MONTH = "2026-10";

const WINDOW = {
  applicationDeadline: "2026-10-02",
  confirmedAt: "2026-09-20T00:00:00+09:00",
};

beforeEach(() => {
  getMonthWindowMock.mockReset();
});

describe("useMonthWindowQuery — getMonthWindow를 그 달로 불러 ['schedule', month, 'window']에 앉힌다", () => {
  it("client와 month를 그대로 넘겨 DAL을 부른다", async () => {
    getMonthWindowMock.mockResolvedValue(WINDOW);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMonthWindowQuery(FAKE_CLIENT, MONTH),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getMonthWindowMock).toHaveBeenCalledWith(FAKE_CLIENT, MONTH);
  });

  it("아직 응답이 없으면 isLoading이 참이다", () => {
    getMonthWindowMock.mockReturnValue(new Promise(() => {}));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMonthWindowQuery(FAKE_CLIENT, MONTH),
      {
        wrapper,
      },
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("응답하면 마감일과 확정 시각을 그대로 낸다", async () => {
    getMonthWindowMock.mockResolvedValue(WINDOW);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMonthWindowQuery(FAKE_CLIENT, MONTH),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(WINDOW);
  });

  it("그 달 근무표가 아직 없으면 null을 그대로 낸다", async () => {
    getMonthWindowMock.mockResolvedValue(null);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMonthWindowQuery(FAKE_CLIENT, MONTH),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
  });

  it("DAL이 실패하면 error를 낸다", async () => {
    getMonthWindowMock.mockRejectedValue(new Error("통신이 끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMonthWindowQuery(FAKE_CLIENT, MONTH),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("캐시 키는 ['schedule', month, 'window']다", async () => {
    getMonthWindowMock.mockResolvedValue(WINDOW);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () => useMonthWindowQuery(FAKE_CLIENT, MONTH),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["schedule", MONTH, "window"])).toEqual(
      WINDOW,
    );
  });
});
