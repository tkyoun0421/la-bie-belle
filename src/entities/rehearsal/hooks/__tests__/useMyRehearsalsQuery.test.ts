import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/rehearsal/model/useMyRehearsals.ts
//
// 본인 리허설이다(design.md 「소유 데이터」) — 키는 ['rehearsal', 'YYYY-MM']. RLS가 이미
// 본인 행으로 좁혀 별도 조건이 없다.

const getMyRehearsalsMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/entities/rehearsal/api/getMyRehearsals.api",
  () => ({
    getMyRehearsals: getMyRehearsalsMock,
  }),
);

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useMyRehearsals } =
  await import("@/features/rehearsal/model/useMyRehearsals");

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
  {
    id: "row-1",
    profile_id: "profile-1",
    work_date: "2026-10-10",
    starts_at: "14:00",
    ends_at: "16:00",
    count: null,
  },
];

beforeEach(() => {
  getMyRehearsalsMock.mockReset();
});

describe("useMyRehearsals — getMyRehearsals를 불러 ['rehearsal', month]에 앉힌다", () => {
  it("client와 month를 그대로 넘겨 DAL을 부른다", async () => {
    getMyRehearsalsMock.mockResolvedValue(ROWS);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMyRehearsals(FAKE_CLIENT, MONTH), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getMyRehearsalsMock).toHaveBeenCalledWith(FAKE_CLIENT, MONTH);
  });

  it("아직 응답이 없으면 isLoading이 참이다", () => {
    getMyRehearsalsMock.mockReturnValue(new Promise(() => {}));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMyRehearsals(FAKE_CLIENT, MONTH), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("응답하면 행을 그대로 낸다", async () => {
    getMyRehearsalsMock.mockResolvedValue(ROWS);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMyRehearsals(FAKE_CLIENT, MONTH), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(ROWS);
  });

  it("DAL이 실패하면 error를 낸다", async () => {
    getMyRehearsalsMock.mockRejectedValue(new Error("통신이 끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMyRehearsals(FAKE_CLIENT, MONTH), {
      wrapper,
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("캐시 키는 ['rehearsal', month]다", async () => {
    getMyRehearsalsMock.mockResolvedValue(ROWS);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useMyRehearsals(FAKE_CLIENT, MONTH), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["rehearsal", MONTH])).toEqual(ROWS);
  });
});
