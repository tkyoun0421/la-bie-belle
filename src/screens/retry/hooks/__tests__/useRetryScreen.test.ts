import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const decideEntryMock = jest.fn<(...args: unknown[]) => Promise<string>>();
const getCurrentUserMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const signOutMock = jest.fn<(...args: unknown[]) => Promise<void>>();

const FAKE_CLIENT = {} as never;

const replaceMock = jest.fn();

jest.unstable_mockModule("expo-router", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule("@/features/auth/lib/decideEntry.lib", () => ({
  decideEntry: decideEntryMock,
}));

jest.unstable_mockModule("@/entities/session/api/getCurrentUser.api", () => ({
  getCurrentUser: getCurrentUserMock,
}));

jest.unstable_mockModule("@/features/auth/lib/signOut.lib", () => ({
  signOut: signOutMock,
  DEVICE_CLEANUP_NOT_WIRED_YET: {
    removePushToken: async (): Promise<void> => {},
    clearPersistedState: async (): Promise<void> => {},
  },
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useRetryScreen } = await import("@/screens/retry/hooks/useRetryScreen");
const { LOGIN_PATH } = await import("@/shared/consts/navigation.const");

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

beforeEach(() => {
  decideEntryMock.mockReset();
  getCurrentUserMock.mockReset();
  signOutMock.mockReset();
  replaceMock.mockClear();

  getCurrentUserMock.mockResolvedValue({
    id: "user-1",
    email: "retry@example.com",
    user_metadata: {},
  });
  signOutMock.mockResolvedValue(undefined);
});

describe("useRetryScreen — 「다시 시도」가 진입 판정을 통째로 다시 돌린다", () => {
  it("판정이 낸 자리로 보낸다", async () => {
    decideEntryMock.mockResolvedValue("/");
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRetryScreen(), {
      wrapper,
    });

    act(() => result.current.retry());

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/"));
  });

  it("판정이 또 /retry면 아무 데도 안 보낸다 — 이 화면이 그대로다", async () => {
    decideEntryMock.mockResolvedValue("/retry");
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRetryScreen(), {
      wrapper,
    });

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.retrying).toBe(false));

    expect(replaceMock).not.toHaveBeenCalled();
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
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRetryScreen(), {
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
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRetryScreen(), {
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
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRetryScreen(), {
      wrapper,
    });

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.retrying).toBe(false));

    expect(replaceMock).not.toHaveBeenCalled();
  });
});

describe("useRetryScreen — 갈 데와 보일 값을 controller가 정한다", () => {
  it("로그아웃이 끝나면 로그인으로 바꿔 넣는다", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRetryScreen(), { wrapper });

    act(() => result.current.signOut(result.current.goLogin));

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith(LOGIN_PATH));
  });

  it("세션이 아직 없으면 보일 값이 빈 자리로 선다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRetryScreen(), { wrapper });

    expect(result.current.email).toBe("");
    expect(result.current.photoUrl).toBeNull();
  });

  it("세션이 오면 그 사람의 메일이 값으로 선다", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRetryScreen(), { wrapper });

    await waitFor(() => expect(result.current.email).toBe("retry@example.com"));
  });
});
