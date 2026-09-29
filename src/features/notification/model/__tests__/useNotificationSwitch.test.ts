import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const setNotificationsEnabledMock =
  jest.fn<(...args: unknown[]) => Promise<void>>();
const requestNotificationPermissionMock =
  jest.fn<(...args: unknown[]) => Promise<boolean>>();

jest.unstable_mockModule(
  "@/entities/notification/dals/set-notifications-enabled",
  () => ({
    setNotificationsEnabled: setNotificationsEnabledMock,
  }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useNotificationSwitch } =
  await import("@/features/notification/model/useNotificationSwitch");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
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

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

const FAKE_CLIENT = {} as never;

beforeEach(() => {
  setNotificationsEnabledMock.mockReset();
  requestNotificationPermissionMock.mockReset();
});

describe("useNotificationSwitch — 켜기는 의사를 먼저 저장한 뒤에 권한을 묻는다", () => {
  it("의사 저장이 끝나기 전에는 권한을 묻지 않는다", async () => {
    const deferred = createDeferred<void>();
    setNotificationsEnabledMock.mockReturnValue(deferred.promise);
    requestNotificationPermissionMock.mockResolvedValue(true);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        useNotificationSwitch(
          FAKE_CLIENT,
          false,
          requestNotificationPermissionMock,
        ),
      { wrapper },
    );

    act(() => {
      result.current.turnOn();
    });

    await waitFor(() =>
      expect(setNotificationsEnabledMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        true,
      ),
    );
    expect(requestNotificationPermissionMock).not.toHaveBeenCalled();

    deferred.resolve();

    await waitFor(() =>
      expect(requestNotificationPermissionMock).toHaveBeenCalled(),
    );
  });
});

describe("useNotificationSwitch — 권한을 거부해도 의사는 참인 채로 끝난다", () => {
  it("권한 요청이 거부로 끝나도 스위치는 켜진 채로 남는다", async () => {
    setNotificationsEnabledMock.mockResolvedValue(undefined);
    requestNotificationPermissionMock.mockResolvedValue(false);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        useNotificationSwitch(
          FAKE_CLIENT,
          false,
          requestNotificationPermissionMock,
        ),
      { wrapper },
    );

    act(() => {
      result.current.turnOn();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current.enabled).toBe(true);
    expect(setNotificationsEnabledMock).toHaveBeenCalledTimes(1);
  });
});

describe("useNotificationSwitch — 끄기는 set_notifications_enabled(false) 하나뿐이고 권한을 안 묻는다", () => {
  it("끄면 의사 저장 함수만 거짓으로 불리고 권한 요청은 안 일어난다", async () => {
    setNotificationsEnabledMock.mockResolvedValue(undefined);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        useNotificationSwitch(
          FAKE_CLIENT,
          true,
          requestNotificationPermissionMock,
        ),
      { wrapper },
    );

    act(() => {
      result.current.turnOff();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(setNotificationsEnabledMock).toHaveBeenCalledWith(
      FAKE_CLIENT,
      false,
    );
    expect(requestNotificationPermissionMock).not.toHaveBeenCalled();
  });
});

describe("useNotificationSwitch — 끄기가 실패하면 스위치가 켜진 자리로 되돌아간다", () => {
  it("끄기 요청이 실패하면 enabled가 다시 참이 된다", async () => {
    setNotificationsEnabledMock.mockRejectedValue(
      new Error("네트워크가 끊겼다"),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        useNotificationSwitch(
          FAKE_CLIENT,
          true,
          requestNotificationPermissionMock,
        ),
      { wrapper },
    );

    act(() => {
      result.current.turnOff();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current.enabled).toBe(true);
  });
});

describe("useNotificationSwitch — 끄기가 성공하면 ['members']를 무효화한다", () => {
  it("관리자 직원 목록의 갈래가 갈리도록 members 캐시가 무효화된다", async () => {
    setNotificationsEnabledMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () =>
        useNotificationSwitch(
          FAKE_CLIENT,
          true,
          requestNotificationPermissionMock,
        ),
      { wrapper },
    );

    act(() => {
      result.current.turnOff();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["members"] }),
    );
  });
});
