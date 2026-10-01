import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const resetWageToDefaultMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/payroll/dals/resetWageToDefault", () => ({
  resetWageToDefault: resetWageToDefaultMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/api/errors");
const { useResetWageToDefault } =
  await import("@/features/payroll/model/useResetWageToDefault");

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
  resetWageToDefaultMock.mockReset();
});

describe("useResetWageToDefault — 성공하면 DAL을 그 인자로 부르고 ['payroll']을 무효화한다", () => {
  it("mutate로 넣은 profileId 그대로 DAL을 부른다", async () => {
    resetWageToDefaultMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useResetWageToDefault(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate("profile-1");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(resetWageToDefaultMock).toHaveBeenCalledWith(
      FAKE_CLIENT,
      "profile-1",
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["payroll"] }),
    );
  });
});

describe("useResetWageToDefault — DomainError('no_default_wage')를 삼키지 않고 error에 그대로 싣는다", () => {
  it("기본 시급이 아직 없을 때의 거절이 그대로 error가 된다", async () => {
    resetWageToDefaultMock.mockRejectedValue(
      new DomainError("no_default_wage"),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useResetWageToDefault(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate("profile-1");
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("no_default_wage");
  });
});
