import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getQrCodeMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const rotateQrMock = jest.fn<(...args: unknown[]) => Promise<void>>();
const buildQrSvgMock = jest.fn<(...args: unknown[]) => Promise<string>>();
const exportQrPaperMock = jest.fn<(...args: unknown[]) => Promise<void>>();

jest.unstable_mockModule("@/entities/qr/api/getQrCode.api", () => ({
  getQrCode: getQrCodeMock,
}));

jest.unstable_mockModule("@/features/qrAdmin/api/rotateQr.api", () => ({
  rotateQr: rotateQrMock,
}));

jest.unstable_mockModule("@/screens/qr/utils/qrSvg.utils", () => ({
  buildQrSvg: buildQrSvgMock,
}));

jest.unstable_mockModule("@/entities/qr/lib/exportQrPaper.lib", () => ({
  exportQrPaper: exportQrPaperMock,
}));

jest.unstable_mockModule("@/shared/config/app.config", () => ({
  readAppUrl: () => "https://app.example",
}));

jest.unstable_mockModule("expo-print", () => ({
  printToFileAsync: jest.fn(),
}));

jest.unstable_mockModule("expo-sharing", () => ({
  shareAsync: jest.fn(),
}));

const FAKE_CLIENT = {} as never;

const backMock = jest.fn();

jest.unstable_mockModule("expo-router", () => ({
  useRouter: () => ({ back: backMock }),
}));

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useQrScreen } = await import("@/screens/qr/hooks/useQrScreen");
const { QR_SCREEN_COPY } = await import("@/screens/qr/consts/qr.const");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
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

const HALL_QR = { qrCode: "code-1", rotatedAt: "2026-10-03T01:00:00.000Z" };

beforeEach(() => {
  getQrCodeMock.mockReset();
  rotateQrMock.mockReset();
  buildQrSvgMock.mockReset();
  exportQrPaperMock.mockReset();

  getQrCodeMock.mockResolvedValue(HALL_QR);
  rotateQrMock.mockResolvedValue(undefined);
  buildQrSvgMock.mockResolvedValue("<svg />");
  exportQrPaperMock.mockResolvedValue(undefined);
});

describe("useQrScreen — 읽은 코드를 그림으로 굽고 돌리기와 내보내기를 든다", () => {
  it("읽은 코드로 주소를 지어 그림을 굽는다", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrScreen(), { wrapper });

    await waitFor(() => expect(result.current.svg).toBe("<svg />"));

    expect(buildQrSvgMock).toHaveBeenCalledWith(
      "https://app.example/check-in?c=code-1",
    );
  });

  it("코드가 없으면 그림도 없다 — 굽지 않는다", async () => {
    getQrCodeMock.mockResolvedValue(null);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrScreen(), { wrapper });

    await waitFor(() => expect(result.current.qr).toBeNull());

    expect(result.current.svg).toBeNull();
    expect(buildQrSvgMock).not.toHaveBeenCalled();
  });

  it("굽다가 넘어지면 그림이 없다 — 화면이 안 멈춘다", async () => {
    buildQrSvgMock.mockRejectedValue(new Error("못 구웠다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrScreen(), { wrapper });

    await waitFor(() => expect(result.current.qr).toEqual(HALL_QR));

    expect(result.current.svg).toBeNull();
  });

  it("내보내기가 구운 그림을 종이로 넘긴다", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrScreen(), { wrapper });

    await waitFor(() => expect(result.current.svg).toBe("<svg />"));

    act(() => result.current.exportPaper());

    await waitFor(() => expect(exportQrPaperMock).toHaveBeenCalledTimes(1));

    const input = exportQrPaperMock.mock.calls[0][0] as { html: string };

    expect(input.html).toContain("<svg />");
  });

  it("그림이 없으면 내보내지 않는다", async () => {
    getQrCodeMock.mockResolvedValue(null);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrScreen(), { wrapper });

    await waitFor(() => expect(result.current.qr).toBeNull());

    act(() => result.current.exportPaper());

    expect(exportQrPaperMock).not.toHaveBeenCalled();
  });

  it("내보내는 동안 또 눌러도 한 번이다", async () => {
    let release = (): void => {};
    exportQrPaperMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = () => resolve();
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrScreen(), { wrapper });

    await waitFor(() => expect(result.current.svg).toBe("<svg />"));

    act(() => result.current.exportPaper());
    await waitFor(() => expect(result.current.exporting).toBe(true));
    act(() => result.current.exportPaper());

    expect(exportQrPaperMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      release();
    });

    expect(result.current.exporting).toBe(false);
  });

  it("종이를 못 만들면 토스트가 서고 버튼이 다시 선다", async () => {
    exportQrPaperMock.mockRejectedValue(new Error("못 만들었다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrScreen(), { wrapper });

    await waitFor(() => expect(result.current.svg).toBe("<svg />"));

    act(() => result.current.exportPaper());

    await waitFor(() =>
      expect(result.current.toast?.message).toBe(QR_SCREEN_COPY.paperFailed),
    );

    expect(result.current.exporting).toBe(false);
  });

  it("확인창은 사람이 열고 새로 뽑기가 성공하면 저절로 닫힌다", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrScreen(), { wrapper });

    await waitFor(() => expect(result.current.svg).toBe("<svg />"));

    act(() => result.current.askRotate());

    expect(result.current.asking).toBe(true);

    act(() => result.current.rotate());

    await waitFor(() => expect(result.current.asking).toBe(false));

    expect(rotateQrMock).toHaveBeenCalledWith(FAKE_CLIENT);
    expect(result.current.toast?.message).toBe(QR_SCREEN_COPY.rotateDone);
  });

  it("새로 뽑기가 넘어지면 확인창이 열린 채로 까닭을 든다", async () => {
    rotateQrMock.mockRejectedValue(new Error("끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrScreen(), { wrapper });

    await waitFor(() => expect(result.current.svg).toBe("<svg />"));

    act(() => result.current.askRotate());
    act(() => result.current.rotate());

    await waitFor(() => expect(result.current.rotateFailed).toBe(true));

    expect(result.current.asking).toBe(true);
    expect(result.current.toast).toBeNull();
  });

  it("넘어진 확인창을 닫으면 까닭도 걷힌다", async () => {
    rotateQrMock.mockRejectedValue(new Error("끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrScreen(), { wrapper });

    await waitFor(() => expect(result.current.svg).toBe("<svg />"));

    act(() => result.current.askRotate());
    act(() => result.current.rotate());
    await waitFor(() => expect(result.current.rotateFailed).toBe(true));

    act(() => result.current.cancelRotate());

    expect(result.current.asking).toBe(false);
    await waitFor(() => expect(result.current.rotateFailed).toBe(false));
  });

  it("토스트를 걷으면 널이다", async () => {
    exportQrPaperMock.mockRejectedValue(new Error("못 만들었다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrScreen(), { wrapper });

    await waitFor(() => expect(result.current.svg).toBe("<svg />"));

    act(() => result.current.exportPaper());
    await waitFor(() => expect(result.current.toast).not.toBeNull());

    act(() => result.current.dismissToast());

    expect(result.current.toast).toBeNull();
  });
});

describe("useQrScreen — 문구와 갈 데를 controller가 완성해 준다", () => {
  beforeEach(() => {
    backMock.mockClear();
  });

  it("언제부터 쓰는 QR인지 한 줄로 준다", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrScreen(), { wrapper });

    await waitFor(() =>
      expect(result.current.startLine).toBe("2026년 10월 3일부터 쓰고 있어요"),
    );
  });

  it("코드가 없으면 그 줄이 없다", async () => {
    getQrCodeMock.mockResolvedValue(null);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrScreen(), { wrapper });

    await waitFor(() => expect(result.current.qr).toBeNull());

    expect(result.current.startLine).toBeNull();
  });

  it("돌리기가 실패하면 물음에 띄울 알림을 준다", async () => {
    rotateQrMock.mockRejectedValue(new Error("못 돌렸다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrScreen(), { wrapper });

    await waitFor(() => expect(result.current.svg).toBe("<svg />"));

    expect(result.current.rotateNotice).toBeUndefined();

    act(() => result.current.askRotate());
    act(() => result.current.rotate());

    await waitFor(() =>
      expect(result.current.rotateNotice).toBe(QR_SCREEN_COPY.sendFailed),
    );
  });

  it("뒤로가 라우터의 뒤로를 부른다", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQrScreen(), { wrapper });

    await waitFor(() => expect(result.current.svg).toBe("<svg />"));

    act(() => result.current.goBack());

    expect(backMock).toHaveBeenCalledTimes(1);
  });
});
