import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// `['profile']`과 `['profile','private']` 둘을 읽어 하나로 합치는 첫 서버 상태 훅이다.
// 두 키를 그대로 쓰는 것은 `docs/2-design/system/runtime.md`의 「TanStack Query 규칙」과
// `docs/2-design/modules/account/design.md`의 「소유 데이터」가 이미 이 두 키를 다른 화면도
// 공유하기 때문이다 — 하나로 합쳐 새 키를 만들면 그 공유가 깨진다.

const getMyProfileMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getProfilePrivateMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/profile/api/getMyProfile.api", () => ({
  getMyProfile: getMyProfileMock,
}));

jest.unstable_mockModule("@/entities/profile/api/profilePrivate.api", () => ({
  getProfilePrivate: getProfilePrivateMock,
}));

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useMyProfileQuery } =
  await import("@/entities/profile/services/useMyProfileQuery");

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

const PROFILE_ROW = {
  id: "profile-1",
  display_name: "박서연",
  photo_url: null,
  role: "worker",
  submitted_at: "2026-09-01T00:00:00.000Z",
  approved_at: "2026-09-02T00:00:00.000Z",
  rejected_at: null,
  blocked_at: null,
  left_at: null,
};

const PRIVATE_ROW = {
  email: "person@example.com",
  phone: "010-0000-0001",
  birth_date: "1993-04-21",
  gender: "female",
};

beforeEach(() => {
  getMyProfileMock.mockReset();
  getProfilePrivateMock.mockReset();
});

describe("useMyProfileQuery — profile과 profile_private을 합쳐 하나로 낸다", () => {
  it("아직 응답이 없으면 isLoading이 참이다", () => {
    getMyProfileMock.mockReturnValue(new Promise(() => {}));
    getProfilePrivateMock.mockReturnValue(new Promise(() => {}));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMyProfileQuery(FAKE_CLIENT, "user-1"),
      {
        wrapper,
      },
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("둘 다 응답하면 값을 합쳐서 낸다", async () => {
    getMyProfileMock.mockResolvedValue(PROFILE_ROW);
    getProfilePrivateMock.mockResolvedValue(PRIVATE_ROW);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMyProfileQuery(FAKE_CLIENT, "user-1"),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(
      expect.objectContaining({
        display_name: "박서연",
        phone: "010-0000-0001",
        gender: "female",
      }),
    );
  });

  it("private 읽기가 실패하면 error를 낸다", async () => {
    getMyProfileMock.mockResolvedValue(PROFILE_ROW);
    getProfilePrivateMock.mockRejectedValue(new Error("통신이 끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMyProfileQuery(FAKE_CLIENT, "user-1"),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });
});
