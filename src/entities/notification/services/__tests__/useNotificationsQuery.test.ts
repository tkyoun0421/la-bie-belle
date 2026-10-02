import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getNotificationsMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/entities/notification/api/getNotifications.api",
  () => ({
    getNotifications: getNotificationsMock,
  }),
  { virtual: true },
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useNotificationsQuery } =
  await import("@/entities/notification/services/useNotificationsQuery");

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

function rowsOfLength(count: number, offset: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `notif-${offset + index}`,
    profile_id: "profile-1",
    kind: "signup_approved",
    payload: {},
    subject_id: null,
    created_at: "2025-09-13T10:00:00+09:00",
    read_at: null,
    claimed_at: null,
    push_attempts: 0,
    pushed_at: null,
  }));
}

beforeEach(() => {
  getNotificationsMock.mockReset();
});

describe("useNotificationsQuery — 캐시 키가 ['notifications']다", () => {
  it("성공하면 그 키에 값이 앉는다", async () => {
    getNotificationsMock.mockResolvedValue(rowsOfLength(1, 0));
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useNotificationsQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["notifications"])).toBeDefined();
  });
});

describe("useNotificationsQuery — 처음 열면 client를 실어 DAL을 한 번 부른다", () => {
  it("getNotifications가 정확히 한 번 불린다", async () => {
    getNotificationsMock.mockResolvedValue(rowsOfLength(50, 0));
    const { wrapper } = createWrapper();

    renderHook(() => useNotificationsQuery(FAKE_CLIENT), { wrapper });

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(1));

    expect(getNotificationsMock.mock.calls[0]?.[0]).toBe(FAKE_CLIENT);
  });
});

describe("useNotificationsQuery — 다음 쪽을 부르면 페이지 인자가 하나 올라간다", () => {
  it("fetchNextPage 뒤 두 번째 호출의 pageParam이 첫 번째와 다르다", async () => {
    getNotificationsMock.mockResolvedValue(rowsOfLength(50, 0));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(2));

    const firstPageParam = getNotificationsMock.mock.calls[0]?.[1];
    const secondPageParam = getNotificationsMock.mock.calls[1]?.[1];

    expect(secondPageParam).not.toEqual(firstPageParam);
  });
});

describe("useNotificationsQuery — 쉰 건 가득 찬 쪽이면 다음 쪽이 있다", () => {
  it("hasNextPage가 true다", async () => {
    getNotificationsMock.mockResolvedValue(rowsOfLength(50, 0));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasNextPage).toBe(true);
  });
});

describe("useNotificationsQuery — 쪽이 50건보다 적으면 끝이다", () => {
  it("hasNextPage가 false다", async () => {
    getNotificationsMock.mockResolvedValue(rowsOfLength(10, 0));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasNextPage).toBe(false);
  });
});

describe("useNotificationsQuery — maxPages가 3이라 네 번째 쪽을 읽으면 쥔 쪽 수가 3을 안 넘는다", () => {
  it("fetchNextPage를 세 번 부르면 data.pages 길이가 3을 넘지 않는다", async () => {
    let call = 0;
    getNotificationsMock.mockImplementation(async () => {
      const page = rowsOfLength(50, call * 50);
      call += 1;

      return page;
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.fetchNextPage();
    });
    await act(async () => {
      await result.current.fetchNextPage();
    });
    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() =>
      expect(result.current.data?.pages.length).toBeLessThanOrEqual(3),
    );
  });
});
