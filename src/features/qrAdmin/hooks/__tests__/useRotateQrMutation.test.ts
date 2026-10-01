import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/qrAdmin/hooks/useRotateQrMutation.ts
//
// 관리자가 「새로 뽑기」를 누르면 rotate_qr을 부르고 성공 시 ['hall','qr']을
// 무효화한다(design.md 「QR 바꾸기」, spec `docs/2-design/spec/attendance-qr.md`).

const rotateQrMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/features/qrAdmin/api/rotateQr.api", () => ({
  rotateQr: rotateQrMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { useRotateQrMutation } =
  await import("@/features/qrAdmin/hooks/useRotateQrMutation");

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

const FAKE_CLIENT = {} as never;

beforeEach(() => {
  rotateQrMock.mockReset();
});

describe("useRotateQrMutation — rotate_qr을 부르고 hall/qr만 무효화한다", () => {
  it("client를 그대로 넘겨 DAL을 부른다", async () => {
    rotateQrMock.mockResolvedValue(undefined);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRotateQrMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(rotateQrMock).toHaveBeenCalledWith(FAKE_CLIENT);
  });

  it("성공하면 ['hall','qr']을 무효화한다", async () => {
    rotateQrMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRotateQrMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["hall", "qr"] }),
    );
  });

  it("DomainError('not_allowed')를 그대로 error에 낸다", async () => {
    rotateQrMock.mockRejectedValue(new DomainError("not_allowed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRotateQrMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("not_allowed");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    rotateQrMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRotateQrMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate();
    });

    expect(rotateQrMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
