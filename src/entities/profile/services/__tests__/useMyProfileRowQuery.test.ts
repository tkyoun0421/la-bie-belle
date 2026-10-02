import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/entities/profile/services/useMyProfileRowQuery.ts
//
// `profiles` 행 하나만 읽는다. 「나」 화면은 개인정보까지 합쳐 봐야 하지만 가입 대기 화면은
// 개인정보 행이 아직 없는 사람도 봐야 해서, 합치는 자리와 읽는 자리가 갈린다.

const getMyProfileMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/profile/api/getMyProfile.api", () => ({
  getMyProfile: getMyProfileMock,
}));

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useMyProfileRowQuery } =
  await import("@/entities/profile/services/useMyProfileRowQuery");

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

  return { wrapper };
}

const FAKE_CLIENT = {} as never;

const ROW = {
  id: "profile-1",
  display_name: "이준호",
  photo_url: null,
  role: "worker",
  submitted_at: "2026-10-01T05:00:00.000Z",
  rejected_at: null,
};

beforeEach(() => {
  getMyProfileMock.mockReset();
  getMyProfileMock.mockResolvedValue(ROW);
});

describe("useMyProfileRowQuery — profiles 행 하나다", () => {
  it("내 id로 읽는다", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMyProfileRowQuery(FAKE_CLIENT, "user-1"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data).toEqual(ROW));

    expect(getMyProfileMock).toHaveBeenCalledWith(FAKE_CLIENT, "user-1");
  });

  it("누구인지 모르면 안 읽는다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMyProfileRowQuery(FAKE_CLIENT, null),
      { wrapper },
    );

    expect(getMyProfileMock).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(true);
  });

  it("프로필 행이 아직 없으면 null이다", async () => {
    getMyProfileMock.mockResolvedValue(null);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMyProfileRowQuery(FAKE_CLIENT, "user-1"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data).toBeNull());
  });

  it("읽기가 넘어지면 오류가 선다", async () => {
    getMyProfileMock.mockRejectedValue(new Error("끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMyProfileRowQuery(FAKE_CLIENT, "user-1"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });
});
