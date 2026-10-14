import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const signInWithGoogleMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const decideEntryMock = jest.fn<(...args: unknown[]) => Promise<string>>();

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
const { useGoogleSignInMutation } =
  await import("@/features/auth/services/useGoogleSignInMutation");

const FAKE_CLIENT = { name: "client" } as never;

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

async function signInAndGetOutcome() {
  const onOutcome = jest.fn();
  const { result } = renderHook(() => useGoogleSignInMutation(FAKE_CLIENT), {
    wrapper: createWrapper(),
  });

  act(() => result.current.signIn(onOutcome));

  await waitFor(() => expect(onOutcome).toHaveBeenCalledTimes(1));

  return onOutcome.mock.calls[0][0];
}

beforeEach(() => {
  signInWithGoogleMock.mockReset();
  decideEntryMock.mockReset();
  signInWithGoogleMock.mockResolvedValue({ ok: true });
  decideEntryMock.mockResolvedValue("/pending");
});

describe("useGoogleSignInMutation — 로그인이 끝나면 목적지까지 판정한다", () => {
  it("ok면 같은 client로 목적지를 한 번 묻고 decided로 알린다", async () => {
    const outcome = await signInAndGetOutcome();

    expect(decideEntryMock).toHaveBeenCalledTimes(1);
    expect(decideEntryMock).toHaveBeenCalledWith({ client: FAKE_CLIENT });
    expect(outcome).toEqual({ kind: "decided", destination: "/pending" });
  });

  it("판정이 /retry여도 decided다", async () => {
    decideEntryMock.mockResolvedValue(RETRY_PATH);

    const outcome = await signInAndGetOutcome();

    expect(outcome).toEqual({ kind: "decided", destination: RETRY_PATH });
  });

  it("signInWithGoogle에 같은 client를 넘긴다", async () => {
    await signInAndGetOutcome();

    expect(signInWithGoogleMock).toHaveBeenCalledTimes(1);
    expect(signInWithGoogleMock.mock.calls[0][0]).toMatchObject({
      client: FAKE_CLIENT,
    });
  });
});

describe("useGoogleSignInMutation — 못 끝난 로그인은 목적지를 묻지 않는다", () => {
  it("cancelled는 cancelled로 알린다", async () => {
    signInWithGoogleMock.mockResolvedValue({
      ok: false,
      reason: "cancelled",
    });

    const outcome = await signInAndGetOutcome();

    expect(outcome).toEqual({ kind: "cancelled" });
    expect(decideEntryMock).not.toHaveBeenCalled();
  });

  it.each(["missing_code", "exchange_failed", "start_failed"])(
    "%s는 failed로 알린다",
    async (reason) => {
      signInWithGoogleMock.mockResolvedValue({ ok: false, reason });

      const outcome = await signInAndGetOutcome();

      expect(outcome).toEqual({ kind: "failed" });
      expect(decideEntryMock).not.toHaveBeenCalled();
    },
  );

  it("signInWithGoogle이 던지면 failed로 알린다", async () => {
    signInWithGoogleMock.mockRejectedValue(new Error("끊겼다"));

    const outcome = await signInAndGetOutcome();

    expect(outcome).toEqual({ kind: "failed" });
  });

  it("signInWithGoogle이 던진 뒤 isPending이 거짓으로 돌아온다", async () => {
    signInWithGoogleMock.mockRejectedValue(new Error("끊겼다"));
    const { result } = renderHook(() => useGoogleSignInMutation(FAKE_CLIENT), {
      wrapper: createWrapper(),
    });

    act(() => result.current.signIn(() => {}));

    await waitFor(() => expect(result.current.isPending).toBe(true));
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});

describe("useGoogleSignInMutation — 도는 동안 다시 안 시작한다", () => {
  it("미해결 동안 isPending이 참이고 그 사이 다시 불러도 한 번이다", async () => {
    let release = (): void => {};
    signInWithGoogleMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ ok: false, reason: "cancelled" });
        }),
    );
    const { result } = renderHook(() => useGoogleSignInMutation(FAKE_CLIENT), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    act(() => result.current.signIn(() => {}));
    await waitFor(() => expect(result.current.isPending).toBe(true));
    act(() => result.current.signIn(() => {}));

    expect(signInWithGoogleMock).toHaveBeenCalledTimes(1);

    act(() => release());
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
