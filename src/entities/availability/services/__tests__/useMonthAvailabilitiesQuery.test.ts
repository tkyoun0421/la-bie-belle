import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getMonthAvailabilitiesMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/entities/availability/api/getMonthAvailabilities.api",
  () => ({
    getMonthAvailabilities: getMonthAvailabilitiesMock,
  }),
);

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useMonthAvailabilitiesQuery } =
  await import("@/entities/availability/services/useMonthAvailabilitiesQuery");

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

const ROWS = [
  { profileId: "profile-1", workDate: "2026-10-10", name: "박서연" },
];

beforeEach(() => {
  getMonthAvailabilitiesMock.mockReset();
});

describe("useMonthAvailabilitiesQuery — getMonthAvailabilities를 그 달로 불러 ['availability', month, 'all']에 앉힌다", () => {
  it("client와 month를 그대로 넘겨 DAL을 부른다", async () => {
    getMonthAvailabilitiesMock.mockResolvedValue(ROWS);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMonthAvailabilitiesQuery(FAKE_CLIENT, MONTH),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getMonthAvailabilitiesMock).toHaveBeenCalledWith(FAKE_CLIENT, MONTH);
  });

  it("아직 응답이 없으면 isLoading이 참이다", () => {
    getMonthAvailabilitiesMock.mockReturnValue(new Promise(() => {}));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMonthAvailabilitiesQuery(FAKE_CLIENT, MONTH),
      { wrapper },
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("응답하면 신청 행을 그대로 낸다", async () => {
    getMonthAvailabilitiesMock.mockResolvedValue(ROWS);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMonthAvailabilitiesQuery(FAKE_CLIENT, MONTH),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(ROWS);
  });

  it("DAL이 실패하면 error를 낸다", async () => {
    getMonthAvailabilitiesMock.mockRejectedValue(new Error("통신이 끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMonthAvailabilitiesQuery(FAKE_CLIENT, MONTH),
      { wrapper },
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("캐시 키는 ['availability', month, 'all']이고 본인 키와 안 겹친다", async () => {
    getMonthAvailabilitiesMock.mockResolvedValue(ROWS);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () => useMonthAvailabilitiesQuery(FAKE_CLIENT, MONTH),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["availability", MONTH, "all"])).toEqual(
      ROWS,
    );
    expect(queryClient.getQueryData(["availability", MONTH])).toBeUndefined();
  });
});
