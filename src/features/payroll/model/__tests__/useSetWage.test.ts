import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const setWageMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/payroll/dals/set-wage", () => ({
  setWage: setWageMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/api/errors");
const { useSetWage } = await import("@/features/payroll/model/useSetWage");

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
  setWageMock.mockReset();
});

describe("useSetWage — 성공하면 DAL을 그 인자로 부르고 ['payroll']을 무효화한다", () => {
  it("mutate로 넣은 profileId·amount 그대로 DAL을 부른다", async () => {
    setWageMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useSetWage(FAKE_CLIENT), { wrapper });

    act(() => {
      result.current.mutate({ profileId: "profile-1", amount: 12000 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(setWageMock).toHaveBeenCalledWith(FAKE_CLIENT, {
      profileId: "profile-1",
      amount: 12000,
    });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["payroll"] }),
    );
  });
});

describe("useSetWage — DomainError를 삼키지 않고 error에 그대로 싣는다", () => {
  it("bad_amount 거절이 그대로 error가 된다", async () => {
    setWageMock.mockRejectedValue(new DomainError("bad_amount"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSetWage(FAKE_CLIENT), { wrapper });

    act(() => {
      result.current.mutate({ profileId: "profile-1", amount: 200000 });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("bad_amount");
  });
});
