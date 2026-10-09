import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getCurrentUserMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const signOutMock = jest.fn<(...args: unknown[]) => Promise<void>>();

const FAKE_CLIENT = {} as never;

const pushMock = jest.fn();
const replaceMock = jest.fn();

jest.unstable_mockModule("expo-router", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
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
const { useLeftScreen } = await import("@/screens/left/hooks/useLeftScreen");
const { LOGIN_PATH, PAYROLL_PATH } =
  await import("@/shared/consts/navigation.const");

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
  pushMock.mockClear();
  replaceMock.mockClear();

  getCurrentUserMock.mockResolvedValue({
    id: "user-2",
    email: "left@example.com",
    user_metadata: {},
  });
  signOutMock.mockResolvedValue(undefined);
});

describe("useLeftScreen — service 둘이 내준 것이 그대로 나온다", () => {
  it("세션의 사람을 그대로 돌려준다", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useLeftScreen(), { wrapper });

    await waitFor(() => expect(result.current.me).not.toBeUndefined());

    expect(result.current.me).toEqual({
      id: "user-2",
      email: "left@example.com",
      googlePhotoUrl: null,
    });
  });

  it("세션을 읽는 손에 실물 클라이언트를 꽂는다", async () => {
    const { wrapper } = createWrapper();

    renderHook(() => useLeftScreen(), { wrapper });

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

    const { result } = renderHook(() => useLeftScreen(), { wrapper });

    expect(result.current.isPending).toBe(false);

    act(() => result.current.signOut(() => {}));
    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => release());
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});

describe("useLeftScreen — 보낼 데는 안 든다", () => {
  it("로그아웃이 끝나면 받은 손을 그대로 부른다", async () => {
    const onDone = jest.fn();
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useLeftScreen(), { wrapper });

    act(() => result.current.signOut(onDone));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  });
});

describe("useLeftScreen — 갈 데와 보일 값을 controller가 정한다", () => {
  it("급여 보기는 급여 화면을 쌓는다", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useLeftScreen(), { wrapper });

    act(() => result.current.openPayroll());

    expect(pushMock).toHaveBeenCalledWith(PAYROLL_PATH);
  });

  it("로그아웃이 끝나면 로그인으로 바꿔 넣는다", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useLeftScreen(), { wrapper });

    act(() => result.current.signOut(result.current.goLogin));

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith(LOGIN_PATH));
  });

  it("세션이 아직 없으면 보일 값이 빈 자리로 선다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useLeftScreen(), { wrapper });

    expect(result.current.email).toBe("");
    expect(result.current.photoUrl).toBeNull();
  });

  it("세션이 오면 그 사람의 메일과 사진이 값으로 선다", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useLeftScreen(), { wrapper });

    await waitFor(() => expect(result.current.email).toBe("left@example.com"));

    expect(result.current.photoUrl).toBeNull();
  });
});
