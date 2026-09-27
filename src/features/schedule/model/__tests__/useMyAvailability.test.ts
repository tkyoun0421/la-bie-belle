import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getMyAvailabilityMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/entities/schedule/dals/get-my-availability",
  () => ({
    getMyAvailability: getMyAvailabilityMock,
  }),
);

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useMyAvailability } =
  await import("@/features/schedule/model/useMyAvailability");

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

const MONTH = "2026-10";

const DATES = ["2026-10-10", "2026-10-17"];

beforeEach(() => {
  getMyAvailabilityMock.mockReset();
});

describe("useMyAvailability — getMyAvailability를 그 달로 불러 ['availability', month]에 앉힌다", () => {
  it("client와 month를 그대로 넘겨 DAL을 부른다", async () => {
    getMyAvailabilityMock.mockResolvedValue(DATES);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMyAvailability(FAKE_CLIENT, MONTH), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getMyAvailabilityMock).toHaveBeenCalledWith(FAKE_CLIENT, MONTH);
  });

  it("아직 응답이 없으면 isLoading이 참이다", () => {
    getMyAvailabilityMock.mockReturnValue(new Promise(() => {}));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMyAvailability(FAKE_CLIENT, MONTH), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("응답하면 신청 날짜를 그대로 낸다", async () => {
    getMyAvailabilityMock.mockResolvedValue(DATES);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMyAvailability(FAKE_CLIENT, MONTH), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(DATES);
  });

  it("아직 낸 신청이 없으면 빈 배열을 그대로 낸다", async () => {
    getMyAvailabilityMock.mockResolvedValue([]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMyAvailability(FAKE_CLIENT, MONTH), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual([]);
  });

  it("DAL이 실패하면 error를 낸다", async () => {
    getMyAvailabilityMock.mockRejectedValue(new Error("통신이 끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMyAvailability(FAKE_CLIENT, MONTH), {
      wrapper,
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("캐시 키는 ['availability', month]다", async () => {
    getMyAvailabilityMock.mockResolvedValue(DATES);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useMyAvailability(FAKE_CLIENT, MONTH), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["availability", MONTH])).toEqual(DATES);
  });
});
