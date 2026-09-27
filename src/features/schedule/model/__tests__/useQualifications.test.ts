import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/schedule/model/useQualifications.ts
//
// `qualifications` 뷰 전체를 읽는다 — `position_grants ∪ 살아 있는 교육 배정`을
// `(profile_id, position)`으로 낸 것이다(design.md 「자격」). `add_assignment`도 픽커도 이
// 뷰를 보므로 TS와 SQL에 같은 규칙이 두 벌 서지 않는다. 픽커의 명단은 `useMembers(client,
// 'active')`가 따로 읽고 이 훅은 자격만 합쳐 쓴다. 캐시 키는 `['members', 'qualifications']`
// 다 — `grant_position` 성공의 `['members']` 무효화가 접두사로 덮는다.

const getQualificationsMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/schedule/dals/get-qualifications", () => ({
  getQualifications: getQualificationsMock,
}));

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useQualifications } =
  await import("@/features/schedule/model/useQualifications");

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

describe("useQualifications — getQualifications를 불러 ['members', 'qualifications']에 앉힌다", () => {
  it("client를 그대로 넘겨 DAL을 부른다", async () => {
    getQualificationsMock.mockResolvedValue(ROWS);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQualifications(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getQualificationsMock).toHaveBeenCalledWith(FAKE_CLIENT);
  });

  it("아직 응답이 없으면 isLoading이 참이다", () => {
    getQualificationsMock.mockReturnValue(new Promise(() => {}));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQualifications(FAKE_CLIENT), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("응답하면 자격 행을 그대로 낸다", async () => {
    getQualificationsMock.mockResolvedValue(ROWS);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQualifications(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(ROWS);
  });

  it("DAL이 실패하면 error를 낸다", async () => {
    getQualificationsMock.mockRejectedValue(new Error("통신이 끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useQualifications(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("캐시 키는 ['members', 'qualifications']다", async () => {
    getQualificationsMock.mockResolvedValue(ROWS);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useQualifications(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["members", "qualifications"])).toEqual(
      ROWS,
    );
  });
});
