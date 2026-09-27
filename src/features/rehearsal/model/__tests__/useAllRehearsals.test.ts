import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/rehearsal/model/useAllRehearsals.ts
//
// 관리자가 보는 전원의 리허설이다(design.md 「소유 데이터」) — 키는
// ['rehearsal', 'YYYY-MM', 'all']. 관리자만 부르고 profiles(display_name)를 임베딩한
// 결과를 그대로 낸다 — 날 시트가 줄마다 이름을 붙인다.

const getAllRehearsalsMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/entities/rehearsal/dals/get-all-rehearsals",
  () => ({
    getAllRehearsals: getAllRehearsalsMock,
  }),
);

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useAllRehearsals } =
  await import("@/features/rehearsal/model/useAllRehearsals");

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
    starts_at: null,
    ends_at: null,
    count: 2,
    profiles: { display_name: "박서연" },
  },
];

beforeEach(() => {
  getAllRehearsalsMock.mockReset();
});

describe("useAllRehearsals — getAllRehearsals를 불러 ['rehearsal', month, 'all']에 앉힌다", () => {
  it("client와 month를 그대로 넘겨 DAL을 부른다", async () => {
    getAllRehearsalsMock.mockResolvedValue(ROWS);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAllRehearsals(FAKE_CLIENT, MONTH), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getAllRehearsalsMock).toHaveBeenCalledWith(FAKE_CLIENT, MONTH);
  });

  it("아직 응답이 없으면 isLoading이 참이다", () => {
    getAllRehearsalsMock.mockReturnValue(new Promise(() => {}));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAllRehearsals(FAKE_CLIENT, MONTH), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("응답하면 이름이 임베딩된 행을 그대로 낸다", async () => {
    getAllRehearsalsMock.mockResolvedValue(ROWS);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAllRehearsals(FAKE_CLIENT, MONTH), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(ROWS);
  });

  it("DAL이 실패하면 error를 낸다", async () => {
    getAllRehearsalsMock.mockRejectedValue(new Error("통신이 끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAllRehearsals(FAKE_CLIENT, MONTH), {
      wrapper,
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("캐시 키는 ['rehearsal', month, 'all']이다", async () => {
    getAllRehearsalsMock.mockResolvedValue(ROWS);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useAllRehearsals(FAKE_CLIENT, MONTH), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["rehearsal", MONTH, "all"])).toEqual(ROWS);
  });
});
