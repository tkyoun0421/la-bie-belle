// 구현 대상: src/features/holiday/hooks/useSetHolidayMutation.ts
//
// `set_holiday`를 부르는 mutation이다(payroll-adjust plan AC-05). 성공하면
// `['payroll']`을 무효화한다. 거절은 삼키지 않고 그대로 error에 싣는다.

import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const setHolidayMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/features/holiday/api/setHoliday.api", () => ({
  setHoliday: setHolidayMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { useSetHolidayMutation } =
  await import("@/features/holiday/hooks/useSetHolidayMutation");

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
  setHolidayMock.mockReset();
});

describe("useSetHolidayMutation — 성공하면 DAL을 그 인자로 부르고 ['payroll']을 무효화한다", () => {
  it("mutate로 넣은 date·on 그대로 DAL을 부른다", async () => {
    setHolidayMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useSetHolidayMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ date: "2026-10-10", on: true });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(setHolidayMock).toHaveBeenCalledWith(FAKE_CLIENT, {
      date: "2026-10-10",
      on: true,
    });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["payroll"] }),
    );
  });
});

describe("useSetHolidayMutation — DomainError를 삼키지 않고 error에 그대로 싣는다", () => {
  it("거절이 그대로 error가 된다", async () => {
    setHolidayMock.mockRejectedValue(new DomainError("not_allowed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSetHolidayMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ date: "2026-10-10", on: false });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("not_allowed");
  });
});
