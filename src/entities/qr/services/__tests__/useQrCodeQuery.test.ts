import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getQrCodeMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const FAKE_STALE_TIME = 12345;

jest.unstable_mockModule("@/entities/qr/api/getQrCode.api", () => ({
  getQrCode: getQrCodeMock,
}));

jest.unstable_mockModule("@/entities/qr/consts/qr.const", () => ({
  QR_CODE_STALE_TIME_MS: FAKE_STALE_TIME,
}));

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useQrCodeQuery } =
  await import("@/entities/qr/services/useQrCodeQuery");

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

const QR_DATA = { qrCode: "abc123", rotatedAt: "2026-03-02T02:00:00Z" };

beforeEach(() => {
  getQrCodeMock.mockReset();
});

describe("useQrCodeQuery — getQrCode를 불러 ['hall','qr']에 앉힌다", () => {
  it("client를 그대로 넘겨 DAL을 부른다", async () => {
    getQrCodeMock.mockResolvedValue(QR_DATA);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrCodeQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getQrCodeMock).toHaveBeenCalledWith(FAKE_CLIENT);
  });

  it("아직 응답이 없으면 isLoading이 참이다", () => {
    getQrCodeMock.mockReturnValue(new Promise(() => {}));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrCodeQuery(FAKE_CLIENT), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("응답하면 값을 그대로 낸다", async () => {
    getQrCodeMock.mockResolvedValue(QR_DATA);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrCodeQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(QR_DATA);
  });

  it("DAL이 실패하면 error를 낸다", async () => {
    getQrCodeMock.mockRejectedValue(new Error("통신이 끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrCodeQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("캐시 키는 queryKeys.hall.qr()가 낸 ['hall','qr']이다", async () => {
    getQrCodeMock.mockResolvedValue(QR_DATA);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useQrCodeQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["hall", "qr"])).toEqual(QR_DATA);
  });

  it("staleTime은 consts의 QR_CODE_STALE_TIME_MS를 그대로 쓴다", async () => {
    getQrCodeMock.mockResolvedValue(QR_DATA);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useQrCodeQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: ["hall", "qr"] }) as
      { options: { staleTime?: number } } | undefined;

    expect(query?.options.staleTime).toBe(FAKE_STALE_TIME);
  });
});
