import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/schedule/model/useMonthAvailabilities.ts
//
// 그 달 전원의 근무 신청을 프로필 이름과 같이 읽는다. 달력 칸의 신청 수, 날 상세의 근무
// 신청 줄, 모아보기 화면이 같은 키 `['availability', month, 'all']`을 쓴다
// (`docs/3-build/plans/schedule-admin.md` AC-01). 행 모양은
// `get-month-availabilities.integration.test.ts`가 이미 확인한
// `{ profile_id, work_date, profiles: { display_name } }`다.

const getMonthAvailabilitiesMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/entities/schedule/api/getMonthAvailabilities.api",
  () => ({
    getMonthAvailabilities: getMonthAvailabilitiesMock,
  }),
);

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useMonthAvailabilities } =
  await import("@/features/schedule/model/useMonthAvailabilities");

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
    profile_id: "profile-1",
    work_date: "2026-10-10",
    profiles: { display_name: "박서연" },
  },
];

beforeEach(() => {
  getMonthAvailabilitiesMock.mockReset();
});

describe("useMonthAvailabilities — getMonthAvailabilities를 그 달로 불러 ['availability', month, 'all']에 앉힌다", () => {
  it("client와 month를 그대로 넘겨 DAL을 부른다", async () => {
    getMonthAvailabilitiesMock.mockResolvedValue(ROWS);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMonthAvailabilities(FAKE_CLIENT, MONTH),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getMonthAvailabilitiesMock).toHaveBeenCalledWith(FAKE_CLIENT, MONTH);
  });

  it("아직 응답이 없으면 isLoading이 참이다", () => {
    getMonthAvailabilitiesMock.mockReturnValue(new Promise(() => {}));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMonthAvailabilities(FAKE_CLIENT, MONTH),
      { wrapper },
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("응답하면 신청 행을 그대로 낸다", async () => {
    getMonthAvailabilitiesMock.mockResolvedValue(ROWS);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMonthAvailabilities(FAKE_CLIENT, MONTH),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(ROWS);
  });

  it("DAL이 실패하면 error를 낸다", async () => {
    getMonthAvailabilitiesMock.mockRejectedValue(new Error("통신이 끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMonthAvailabilities(FAKE_CLIENT, MONTH),
      { wrapper },
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  /**
   * 본인 신청을 읽는 `useMyAvailability`가 맨 키를 쥐고 이쪽이 꼬리를 받는다 — 어느 쪽이
   * 받는지는 design.md의 키 목록이 정한다
   * ([관찰 045](../../../../../docs/observations/045-two-queries-share-one-cache-key.md)).
   */
  it("캐시 키는 ['availability', month, 'all']이고 본인 키와 안 겹친다", async () => {
    getMonthAvailabilitiesMock.mockResolvedValue(ROWS);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () => useMonthAvailabilities(FAKE_CLIENT, MONTH),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["availability", MONTH, "all"])).toEqual(
      ROWS,
    );
    expect(queryClient.getQueryData(["availability", MONTH])).toBeUndefined();
  });
});
