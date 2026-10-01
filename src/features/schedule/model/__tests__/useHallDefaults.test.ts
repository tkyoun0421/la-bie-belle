import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/schedule/model/useHallDefaults.ts
//
// 홀의 자리·근무 시간 기본값을 읽는다. 관리자 홈의 기본값 줄과 기본값 시트가 이 값을
// 쓴다. `set_hall_defaults`가 무효화하는 키가 `['hall']`이므로(design.md 「홀
// 기본값」) 이 훅의 캐시 키도 `['hall']`이다 — 달마다 갈리는 값이 아니라서 month를
// 안 받는다.

const getHallDefaultsMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/schedule/api/getHallDefaults.api", () => ({
  getHallDefaults: getHallDefaultsMock,
}));

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useHallDefaults } =
  await import("@/features/schedule/model/useHallDefaults");

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

const HALL_DEFAULTS = {
  default_slots: [{ positions: ["팀장"], count: 1 }],
  default_starts: "10:00",
  default_ends: "19:00",
};

beforeEach(() => {
  getHallDefaultsMock.mockReset();
});

describe("useHallDefaults — getHallDefaults를 불러 ['hall']에 앉힌다", () => {
  it("client를 그대로 넘겨 DAL을 부른다", async () => {
    getHallDefaultsMock.mockResolvedValue(HALL_DEFAULTS);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useHallDefaults(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getHallDefaultsMock).toHaveBeenCalledWith(FAKE_CLIENT);
  });

  it("아직 응답이 없으면 isLoading이 참이다", () => {
    getHallDefaultsMock.mockReturnValue(new Promise(() => {}));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useHallDefaults(FAKE_CLIENT), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("응답하면 기본값을 그대로 낸다", async () => {
    getHallDefaultsMock.mockResolvedValue(HALL_DEFAULTS);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useHallDefaults(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(HALL_DEFAULTS);
  });

  it("DAL이 실패하면 error를 낸다", async () => {
    getHallDefaultsMock.mockRejectedValue(new Error("통신이 끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useHallDefaults(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("캐시 키는 ['hall']이다", async () => {
    getHallDefaultsMock.mockResolvedValue(HALL_DEFAULTS);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useHallDefaults(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["hall"])).toEqual(HALL_DEFAULTS);
  });
});
