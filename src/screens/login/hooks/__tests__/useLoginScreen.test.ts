import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const signInWithGoogleMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const decideEntryMock = jest.fn<(...args: unknown[]) => Promise<string>>();
const replaceMock = jest.fn();

const FAKE_CLIENT = { name: "supabase" } as never;

jest.unstable_mockModule("expo-router", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));
jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));
jest.unstable_mockModule("@/features/auth/lib/signInWithGoogle.lib", () => ({
  signInWithGoogle: signInWithGoogleMock,
}));
jest.unstable_mockModule("@/features/auth/lib/decideEntry.lib", () => ({
  decideEntry: decideEntryMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { RETRY_PATH } = await import("@/shared/consts/navigation.const");
const { useLoginScreen } = await import("@/screens/login/hooks/useLoginScreen");

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

  return wrapper;
}

function renderLogin() {
  return renderHook(() => useLoginScreen(), { wrapper: createWrapper() });
}

function holdSignIn() {
  let release = (result: unknown): void => {
    void result;
  };
  signInWithGoogleMock.mockImplementation(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );

  return (result: unknown) => release(result);
}

beforeEach(() => {
  signInWithGoogleMock.mockReset();
  decideEntryMock.mockReset();
  replaceMock.mockClear();
  signInWithGoogleMock.mockResolvedValue({ ok: true });
  decideEntryMock.mockResolvedValue("/pending");
});

describe("useLoginScreen — 로그인이 끝나면 판정이 낸 자리로 바꿔 넣는다", () => {
  it.each(["/pending", RETRY_PATH])(
    "%s가 목적지면 거기로 replace한다",
    async (destination) => {
      decideEntryMock.mockResolvedValue(destination);
      const { result } = renderLogin();

      act(() => result.current.signIn());

      await waitFor(() => expect(replaceMock).toHaveBeenCalledTimes(1));
      expect(replaceMock).toHaveBeenCalledWith(destination);
    },
  );

  it("signInWithGoogle이 화면의 client를 받는다", async () => {
    const { result } = renderLogin();

    act(() => result.current.signIn());

    await waitFor(() => expect(replaceMock).toHaveBeenCalledTimes(1));
    expect(signInWithGoogleMock.mock.calls[0][0]).toMatchObject({
      client: FAKE_CLIENT,
    });
  });
});

describe("useLoginScreen — 창을 닫은 것은 조용히 지나간다", () => {
  it("cancelled면 이동도 실패 줄도 없고 버튼이 풀린다", async () => {
    signInWithGoogleMock.mockResolvedValue({ ok: false, reason: "cancelled" });
    const { result } = renderLogin();

    act(() => result.current.signIn());
    await waitFor(() => expect(signInWithGoogleMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.busy).toBe(false));

    expect(replaceMock).not.toHaveBeenCalled();
    expect(result.current.failed).toBe(false);
  });
});

describe("useLoginScreen — 실패 줄은 다시 누를 때까지 선다", () => {
  it("실패하면 failed가 참이고 이동하지 않는다", async () => {
    signInWithGoogleMock.mockResolvedValue({
      ok: false,
      reason: "exchange_failed",
    });
    const { result } = renderLogin();

    expect(result.current.failed).toBe(false);

    act(() => result.current.signIn());

    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("다시 누르면 도는 동안 failed가 거짓으로 돌아간다", async () => {
    signInWithGoogleMock.mockResolvedValueOnce({
      ok: false,
      reason: "missing_code",
    });
    const { result } = renderLogin();

    act(() => result.current.signIn());
    await waitFor(() => expect(result.current.failed).toBe(true));

    const release = holdSignIn();
    act(() => result.current.signIn());

    await waitFor(() => expect(result.current.busy).toBe(true));
    expect(result.current.failed).toBe(false);

    act(() => release({ ok: false, reason: "cancelled" }));
    await waitFor(() => expect(result.current.busy).toBe(false));
  });
});

describe("useLoginScreen — 도는 동안 버튼이 잠긴다", () => {
  it("미해결 동안 busy가 참이고 연타해도 한 번만 시작한다", async () => {
    const release = holdSignIn();
    const { result } = renderLogin();

    expect(result.current.busy).toBe(false);

    act(() => result.current.signIn());
    await waitFor(() => expect(result.current.busy).toBe(true));
    act(() => result.current.signIn());
    act(() => result.current.signIn());

    expect(signInWithGoogleMock).toHaveBeenCalledTimes(1);

    act(() => release({ ok: false, reason: "cancelled" }));
    await waitFor(() => expect(result.current.busy).toBe(false));
  });
});
