import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/hallDefaults/services/useSetHallDefaultsMutation.ts
//
// 홀의 자리·근무 시간 기본값을 바꾼다. 연 날은 안 바뀌므로 캐시 갱신은
// `['hall']`뿐이다 — `['schedule']`은 안 건드린다
// (`docs/2-design/modules/schedule/design.md`의 「홀 기본값」).

const setHallDefaultsMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/features/hallDefaults/api/setHallDefaults.api",
  () => ({
    setHallDefaults: setHallDefaultsMock,
  }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { useSetHallDefaultsMutation } =
  await import("@/features/hallDefaults/services/useSetHallDefaultsMutation");

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

const SLOTS = [{ positions: ["팀장"], count: 1 }];

beforeEach(() => {
  setHallDefaultsMock.mockReset();
});

describe("useSetHallDefaultsMutation — set_hall_defaults를 부르고 hall만 무효화한다", () => {
  it("성공하면 DAL을 (client, { slots, starts, ends })로 부르고 ['hall']을 무효화한다", async () => {
    setHallDefaultsMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () => useSetHallDefaultsMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ slots: SLOTS, starts: "10:00", ends: "19:00" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(setHallDefaultsMock).toHaveBeenCalledWith(FAKE_CLIENT, {
      slots: SLOTS,
      starts: "10:00",
      ends: "19:00",
    });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["hall"] }),
    );
  });

  it("연 날은 그대로라 ['schedule']은 무효화하지 않는다", async () => {
    setHallDefaultsMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () => useSetHallDefaultsMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ slots: SLOTS, starts: "10:00", ends: "19:00" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["schedule"] }),
    );
  });

  it("끝이 시작보다 이르면 DomainError('bad_hours')를 그대로 error에 낸다", async () => {
    setHallDefaultsMock.mockRejectedValue(new DomainError("bad_hours"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useSetHallDefaultsMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ slots: SLOTS, starts: "22:00", ends: "10:00" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("bad_hours");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    setHallDefaultsMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useSetHallDefaultsMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ slots: SLOTS, starts: "10:00", ends: "19:00" });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({ slots: SLOTS, starts: "09:00", ends: "18:00" });
    });

    expect(setHallDefaultsMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
