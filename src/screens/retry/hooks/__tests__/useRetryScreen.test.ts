import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/screens/retry/hooks/useRetryScreen.ts
//
// 읽기 실패 화면의 controller다. 이 화면이 제 상태를 드는 자리는 「다시 시도」 한 번뿐이다 —
// 판정을 다시 돌리는 동안 버튼이 돌고, 성공하면 원래 가려던 자리로 보내고, 실패하면 이
// 화면이 그대로다(`docs/2-design/modules/account/screens/login.md`의 「읽기 실패 짜임」).
//
// 세션의 사람과 로그아웃은 여기 안 든다 — service 둘이 그것을 가지고 `.tsx`가 직접 부른다.
// controller가 서는 것은 **화면이 제 업무 상태를 들 때**고, 이 화면에서 그것은 재시도다.

const decideEntryMock = jest.fn<(...args: unknown[]) => Promise<string>>();

jest.unstable_mockModule("@/features/auth/lib/decideEntry.lib", () => ({
  decideEntry: decideEntryMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useRetryScreen } = await import("@/screens/retry/hooks/useRetryScreen");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
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

const FAKE_CLIENT = {} as never;

function fakeRouter() {
  return { replace: jest.fn() };
}

beforeEach(() => {
  decideEntryMock.mockReset();
});

describe("useRetryScreen — 「다시 시도」가 진입 판정을 통째로 다시 돌린다", () => {
  it("판정이 낸 자리로 보낸다", async () => {
    decideEntryMock.mockResolvedValue("/");
    const router = fakeRouter();
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRetryScreen(FAKE_CLIENT, router), {
      wrapper,
    });

    act(() => result.current.retry());

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
  });

  it("판정이 또 /retry면 아무 데도 안 보낸다 — 이 화면이 그대로다", async () => {
    decideEntryMock.mockResolvedValue("/retry");
    const router = fakeRouter();
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRetryScreen(FAKE_CLIENT, router), {
      wrapper,
    });

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.retrying).toBe(false));

    expect(router.replace).not.toHaveBeenCalled();
  });

  it("도는 동안 retrying이 참이고 끝나면 거짓이다", async () => {
    let release = (destination: string): void => {
      void destination;
    };
    decideEntryMock.mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          release = (destination) => resolve(destination);
        }),
    );
    const router = fakeRouter();
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRetryScreen(FAKE_CLIENT, router), {
      wrapper,
    });

    expect(result.current.retrying).toBe(false);

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.retrying).toBe(true));

    act(() => release("/retry"));
    await waitFor(() => expect(result.current.retrying).toBe(false));
  });

  it("도는 동안 또 누르면 판정을 다시 안 돌린다", async () => {
    let release = (destination: string): void => {
      void destination;
    };
    decideEntryMock.mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          release = (destination) => resolve(destination);
        }),
    );
    const router = fakeRouter();
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRetryScreen(FAKE_CLIENT, router), {
      wrapper,
    });

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.retrying).toBe(true));
    act(() => result.current.retry());

    expect(decideEntryMock).toHaveBeenCalledTimes(1);

    act(() => release("/retry"));
    await waitFor(() => expect(result.current.retrying).toBe(false));
  });

  it("판정이 던져도 화면이 안 멈춘다 — retrying이 풀린다", async () => {
    decideEntryMock.mockRejectedValue(new Error("끊겼다"));
    const router = fakeRouter();
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRetryScreen(FAKE_CLIENT, router), {
      wrapper,
    });

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.retrying).toBe(false));

    expect(router.replace).not.toHaveBeenCalled();
  });
});
