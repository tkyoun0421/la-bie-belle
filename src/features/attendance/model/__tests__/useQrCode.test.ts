import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/attendance/model/useQrCode.ts
//
// 관리자 QR 화면이 현재 코드를 읽는 훅이다. 캐시 키·staleTime은
// `@/entities/attendance/dals/get-qr-code`가 정한 상수를 그대로 쓴다
// (design.md 「QR」, spec `docs/2-design/spec/attendance-qr.md`).

const getQrCodeMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const FAKE_STALE_TIME = 12345;

jest.unstable_mockModule("@/entities/attendance/dals/get-qr-code", () => ({
  getQrCode: getQrCodeMock,
  qrCodeKey: () => ["hall", "qr"],
  QR_CODE_STALE_TIME_MS: FAKE_STALE_TIME,
}));

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useQrCode } = await import("@/features/attendance/model/useQrCode");

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

describe("useQrCode — getQrCode를 불러 ['hall','qr']에 앉힌다", () => {
  it("client를 그대로 넘겨 DAL을 부른다", async () => {
    getQrCodeMock.mockResolvedValue(QR_DATA);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrCode(FAKE_CLIENT), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getQrCodeMock).toHaveBeenCalledWith(FAKE_CLIENT);
  });

  it("아직 응답이 없으면 isLoading이 참이다", () => {
    getQrCodeMock.mockReturnValue(new Promise(() => {}));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrCode(FAKE_CLIENT), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });

  it("응답하면 값을 그대로 낸다", async () => {
    getQrCodeMock.mockResolvedValue(QR_DATA);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrCode(FAKE_CLIENT), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(QR_DATA);
  });

  it("DAL이 실패하면 error를 낸다", async () => {
    getQrCodeMock.mockRejectedValue(new Error("통신이 끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrCode(FAKE_CLIENT), { wrapper });

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("캐시 키는 qrCodeKey()가 낸 ['hall','qr']이다", async () => {
    getQrCodeMock.mockResolvedValue(QR_DATA);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useQrCode(FAKE_CLIENT), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["hall", "qr"])).toEqual(QR_DATA);
  });

  it("staleTime은 DAL의 QR_CODE_STALE_TIME_MS를 그대로 쓴다", async () => {
    getQrCodeMock.mockResolvedValue(QR_DATA);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useQrCode(FAKE_CLIENT), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // `Query.options`의 타입은 `QueryOptions`라 `staleTime`을 안 든다 — 그 값을 드는 것은
    // `QueryObserverOptions`고, 옵저버가 붙으면 런타임에는 같은 객체에 실려 온다.
    const query = queryClient
      .getQueryCache()
      .find({ queryKey: ["hall", "qr"] }) as
      { options: { staleTime?: number } } | undefined;

    expect(query?.options.staleTime).toBe(FAKE_STALE_TIME);
  });
});
