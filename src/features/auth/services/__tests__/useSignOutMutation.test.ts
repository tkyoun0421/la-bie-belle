import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/auth/services/useSignOutMutation.ts
//
// 로그아웃 뒤 기기를 비우는 순서는 `lib/signOut.lib.ts`가 들고, 그 손에 무엇을 꽂을지가
// 화면 다섯(pending·left·blocked·retry·profile)에 **글자까지 같이** 적혀 있었다 —
// `supabase.auth.signOut()`과 `queryClient.clear()`를 매번 손으로 꽂는다.
//
// 이 훅이 그 꽂는 일을 한 자리로 가진다. 보낼 데는 화면마다 다를 수 있어 안 든다 —
// 지금은 다섯 다 `/login`이지만 그것은 이동이고 `services/`는 `expo-router`를 못 당긴다.

const signOutMock = jest.fn<(...args: unknown[]) => Promise<void>>();

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
const { useSignOutMutation } =
  await import("@/features/auth/services/useSignOutMutation");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
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

function fakeClient() {
  const authSignOut = jest.fn(async () => ({ error: null }));

  return { client: { auth: { signOut: authSignOut } } as never, authSignOut };
}

beforeEach(() => {
  signOutMock.mockReset();
  signOutMock.mockResolvedValue(undefined);
});

describe("useSignOutMutation — 로그아웃 순서에 손을 꽂아 한 번에 돌린다", () => {
  it("기기 정리 둘과 세션 끊기와 캐시 비우기를 다 넘긴다", async () => {
    const { wrapper } = createWrapper();
    const { client } = fakeClient();

    const { result } = renderHook(() => useSignOutMutation(client), {
      wrapper,
    });

    act(() => result.current.signOut(() => {}));

    await waitFor(() => expect(signOutMock).toHaveBeenCalledTimes(1));

    const deps = signOutMock.mock.calls[0][0] as Record<string, unknown>;

    expect(Object.keys(deps).sort()).toEqual([
      "clearPersistedState",
      "clearQueryClient",
      "removePushToken",
      "signOut",
    ]);
  });

  it("넘긴 signOut이 클라이언트의 auth.signOut을 부른다", async () => {
    const { wrapper } = createWrapper();
    const { client, authSignOut } = fakeClient();

    const { result } = renderHook(() => useSignOutMutation(client), {
      wrapper,
    });

    act(() => result.current.signOut(() => {}));

    await waitFor(() => expect(signOutMock).toHaveBeenCalledTimes(1));

    const deps = signOutMock.mock.calls[0][0] as {
      signOut: () => Promise<void>;
    };
    await deps.signOut();

    expect(authSignOut).toHaveBeenCalledTimes(1);
  });

  it("넘긴 clearQueryClient가 캐시를 비운다", async () => {
    const { wrapper, queryClient } = createWrapper();
    const { client } = fakeClient();
    queryClient.setQueryData(["session", "user"], { id: "user-1" });

    const { result } = renderHook(() => useSignOutMutation(client), {
      wrapper,
    });

    act(() => result.current.signOut(() => {}));

    await waitFor(() => expect(signOutMock).toHaveBeenCalledTimes(1));

    const deps = signOutMock.mock.calls[0][0] as {
      clearQueryClient: () => void;
    };
    deps.clearQueryClient();

    expect(queryClient.getQueryData(["session", "user"])).toBeUndefined();
  });

  it("끝나면 받은 onDone을 부른다 — 보낼 데는 화면이 정한다", async () => {
    const { wrapper } = createWrapper();
    const { client } = fakeClient();
    const onDone = jest.fn();

    const { result } = renderHook(() => useSignOutMutation(client), {
      wrapper,
    });

    act(() => result.current.signOut(onDone));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  });

  it("도는 중에 캐시를 비워도 onDone이 불린다 — clear가 제 mutation을 지운다", async () => {
    const { wrapper, queryClient } = createWrapper();
    const { client } = fakeClient();
    const onDone = jest.fn();
    signOutMock.mockImplementation(async (...args: unknown[]) => {
      const deps = args[0] as { clearQueryClient: () => void };
      deps.clearQueryClient();
    });

    const { result } = renderHook(() => useSignOutMutation(client), {
      wrapper,
    });

    act(() => result.current.signOut(onDone));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));

    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
  });

  it("보내는 동안은 다시 안 보낸다 — 두 번 눌러도 한 번이다", async () => {
    const { wrapper } = createWrapper();
    const { client } = fakeClient();
    let release = (): void => {};
    signOutMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = () => resolve();
        }),
    );

    const { result } = renderHook(() => useSignOutMutation(client), {
      wrapper,
    });

    act(() => result.current.signOut(() => {}));
    await waitFor(() => expect(result.current.isPending).toBe(true));
    act(() => result.current.signOut(() => {}));

    expect(signOutMock).toHaveBeenCalledTimes(1);

    act(() => release());
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
