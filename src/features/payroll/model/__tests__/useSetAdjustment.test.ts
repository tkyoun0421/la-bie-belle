// 구현 대상: src/features/payroll/model/useSetAdjustment.ts
//
// `set_adjustment`를 부르는 mutation이다(payroll-adjust plan AC-05). 성공하면
// `['payroll']`을 무효화한다. `p_reason`은 화면이 고른 갈래 이름이고 셋 중 하나다 —
// 「결근」·「연장」·「원래대로」(payroll/design.md 「조정」). 거절은 삼키지 않고 그대로
// error에 싣는다.

import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const setAdjustmentMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/payroll/dals/setAdjustment", () => ({
  setAdjustment: setAdjustmentMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/api/errors");
const { useSetAdjustment } =
  await import("@/features/payroll/model/useSetAdjustment");

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
  setAdjustmentMock.mockReset();
});

describe("useSetAdjustment — 성공하면 DAL을 그 인자로 부르고 ['payroll']을 무효화한다", () => {
  it("결근을 고르면 reason이 「결근」 그대로 DAL에 실린다", async () => {
    setAdjustmentMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useSetAdjustment(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        dayId: "day-1",
        profileId: "profile-1",
        minutes: -540,
        reason: "결근",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(setAdjustmentMock).toHaveBeenCalledWith(FAKE_CLIENT, {
      dayId: "day-1",
      profileId: "profile-1",
      minutes: -540,
      reason: "결근",
    });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["payroll"] }),
    );
  });

  it("연장을 고르면 reason이 「연장」 그대로 DAL에 실린다", async () => {
    setAdjustmentMock.mockResolvedValue(undefined);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSetAdjustment(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        dayId: "day-1",
        profileId: "profile-2",
        minutes: 60,
        reason: "연장",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(setAdjustmentMock).toHaveBeenCalledWith(
      FAKE_CLIENT,
      expect.objectContaining({ reason: "연장" }),
    );
  });

  it("원래대로를 고르면 reason이 「원래대로」 그대로 DAL에 실린다", async () => {
    setAdjustmentMock.mockResolvedValue(undefined);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSetAdjustment(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        dayId: "day-1",
        profileId: "profile-3",
        minutes: 0,
        reason: "원래대로",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(setAdjustmentMock).toHaveBeenCalledWith(
      FAKE_CLIENT,
      expect.objectContaining({ reason: "원래대로" }),
    );
  });
});

describe("useSetAdjustment — DomainError를 삼키지 않고 error에 그대로 싣는다", () => {
  it("not_allowed 거절이 그대로 error가 된다", async () => {
    setAdjustmentMock.mockRejectedValue(new DomainError("not_allowed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSetAdjustment(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        dayId: "day-1",
        profileId: "profile-1",
        minutes: -540,
        reason: "결근",
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("not_allowed");
  });
});
