import { jest } from "@jest/globals";

const keepAwakeMock = jest.fn();

jest.unstable_mockModule("expo-keep-awake", () => ({
  useKeepAwake: keepAwakeMock,
}));

const { renderHook } = await import("@testing-library/react-native");
const { FULLSCREEN_QR_MARGIN, QR_SCREEN_COPY } =
  await import("@/screens/qr/consts/qr.const");
const { useQrFullscreen } = await import("@/screens/qr/hooks/useQrFullscreen");

describe("useQrFullscreen — 크게 띄운 QR의 크기를 정한다", () => {
  beforeEach(() => {
    keepAwakeMock.mockClear();
  });

  it("화면 너비에서 여백을 뺀 크기를 준다", () => {
    const { result } = renderHook(() => useQrFullscreen({ width: 390 }));

    expect(result.current.size).toBe(390 - FULLSCREEN_QR_MARGIN);
  });

  it("너비가 여백보다 좁으면 0으로 막는다", () => {
    const { result } = renderHook(() => useQrFullscreen({ width: 40 }));

    expect(result.current.size).toBe(0);
  });

  it("닫기 문구를 완성해 준다", () => {
    const { result } = renderHook(() => useQrFullscreen({ width: 390 }));

    expect(result.current.closeLabel).toBe(QR_SCREEN_COPY.close);
  });

  it("띄워둔 동안 화면이 꺼지지 않게 쥔다", () => {
    renderHook(() => useQrFullscreen({ width: 390 }));

    expect(keepAwakeMock).toHaveBeenCalled();
  });
});
