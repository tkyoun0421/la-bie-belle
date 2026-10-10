import { jest } from "@jest/globals";

const { renderHook } = await import("@testing-library/react-native");
const { useCloseSheetOnSuccess } =
  await import("@/shared/hooks/useCloseSheetOnSuccess");

describe("useCloseSheetOnSuccess — 성공 전엔 닫는 손을 안 부른다", () => {
  it("succeeded가 거짓이면 reset과 leave를 안 부른다", () => {
    const reset = jest.fn<() => void>();
    const leave = jest.fn<() => void>();

    renderHook(() => useCloseSheetOnSuccess(false, reset, leave));

    expect(reset).not.toHaveBeenCalled();
    expect(leave).not.toHaveBeenCalled();
  });
});

describe("useCloseSheetOnSuccess — 성공하면 시트를 닫는다", () => {
  it("succeeded가 참이 되면 reset과 leave를 부른다", () => {
    const reset = jest.fn<() => void>();
    const leave = jest.fn<() => void>();

    const { rerender } = renderHook(
      ({ succeeded }: { succeeded: boolean }) =>
        useCloseSheetOnSuccess(succeeded, reset, leave),
      { initialProps: { succeeded: false } },
    );

    rerender({ succeeded: true });

    expect(reset).toHaveBeenCalledTimes(1);
    expect(leave).toHaveBeenCalledTimes(1);
  });

  it("succeeded가 계속 거짓이면 다시 불리지 않는다", () => {
    const reset = jest.fn<() => void>();
    const leave = jest.fn<() => void>();

    const { rerender } = renderHook(
      ({ succeeded }: { succeeded: boolean }) =>
        useCloseSheetOnSuccess(succeeded, reset, leave),
      { initialProps: { succeeded: false } },
    );

    rerender({ succeeded: false });

    expect(reset).not.toHaveBeenCalled();
    expect(leave).not.toHaveBeenCalled();
  });
});
