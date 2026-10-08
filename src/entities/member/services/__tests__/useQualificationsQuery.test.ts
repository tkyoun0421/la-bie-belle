import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getQualificationsMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/member/api/getQualifications.api", () => ({
  getQualifications: getQualificationsMock,
}));

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useQualificationsQuery } =
  await import("@/entities/member/services/useQualificationsQuery");

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

const ROWS = [
  { profile_id: "profile-1", position: "스캔" },
  { profile_id: "profile-2", position: "팀장" },
];

beforeEach(() => {
  getQualificationsMock.mockReset();
});

describe("useQualificationsQuery — getQualifications를 불러 ['members', 'qualifications']에 앉힌다", () => {
  it("client를 그대로 넘겨 DAL을 부른다", async () => {
    getQualificationsMock.mockResolvedValue(ROWS);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQualificationsQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getQualificationsMock).toHaveBeenCalledWith(FAKE_CLIENT);
  });

  it("아직 응답이 없으면 isLoading이 참이다", () => {
    getQualificationsMock.mockReturnValue(new Promise(() => {}));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQualificationsQuery(FAKE_CLIENT), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("응답하면 자격 행을 그대로 낸다", async () => {
    getQualificationsMock.mockResolvedValue(ROWS);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQualificationsQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(ROWS);
  });

  it("DAL이 실패하면 error를 낸다", async () => {
    getQualificationsMock.mockRejectedValue(new Error("통신이 끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQualificationsQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("캐시 키는 ['members', 'qualifications']다", async () => {
    getQualificationsMock.mockResolvedValue(ROWS);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useQualificationsQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["members", "qualifications"])).toEqual(
      ROWS,
    );
  });
});
