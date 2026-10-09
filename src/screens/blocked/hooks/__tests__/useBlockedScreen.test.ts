import { jest } from "@jest/globals";
import type { ReactNode } from "react";

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
const { useBlockedScreen } =
  await import("@/screens/blocked/hooks/useBlockedScreen");
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
  getCurrentUserMock.mockReset();
  signOutMock.mockReset();
  replaceMock.mockClear();

  getCurrentUserMock.mockResolvedValue({
    id: "user-1",
    email: "blocked@example.com",
    user_metadata: { avatar_url: "https://example.com/photo.png" },
  });
  signOutMock.mockResolvedValue(undefined);
});

describe("useBlockedScreen — service 둘이 내준 것이 그대로 나온다", () => {
  it("세션의 사람을 그대로 돌려준다", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useBlockedScreen(), { wrapper });

    await waitFor(() => expect(result.current.me).not.toBeUndefined());

    expect(result.current.me).toEqual({
      id: "user-1",
      email: "blocked@example.com",
      googlePhotoUrl: "https://example.com/photo.png",
    });
  });

  it("세션을 읽는 손에 실물 클라이언트를 꽂는다", async () => {
    const { wrapper } = createWrapper();

    renderHook(() => useBlockedScreen(), { wrapper });

    await waitFor(() =>
      expect(getCurrentUserMock).toHaveBeenCalledWith(FAKE_CLIENT),
    );
  });

  it("보내는 동안 isPending이 참이고 끝나면 거짓이다", async () => {
    let release = (): void => {};
    signOutMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = () => resolve();
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useBlockedScreen(), { wrapper });

    expect(result.current.isPending).toBe(false);

    act(() => result.current.leave());
    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => release());
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});

describe("useBlockedScreen — 갈 데와 보일 값을 controller가 정한다", () => {
  it("로그아웃이 끝나면 로그인으로 바꿔 넣는다", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useBlockedScreen(), { wrapper });

    act(() => result.current.leave());

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith(LOGIN_PATH));
  });

  it("세션이 아직 없으면 보일 값이 빈 자리로 선다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useBlockedScreen(), { wrapper });

    expect(result.current.email).toBe("");
    expect(result.current.photoUrl).toBeNull();
  });

  it("세션이 오면 그 사람의 메일과 사진이 값으로 선다", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useBlockedScreen(), { wrapper });

    await waitFor(() =>
      expect(result.current.email).toBe("blocked@example.com"),
    );

    expect(result.current.photoUrl).toBe("https://example.com/photo.png");
  });
});
