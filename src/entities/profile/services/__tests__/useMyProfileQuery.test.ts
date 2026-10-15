import { jest } from "@jest/globals";
import type { ReactNode } from "react";
import type { getMyProfile } from "@/entities/profile/api/getMyProfile.api";
import type { Profile } from "@/entities/profile/model/profile.type";

const getMyProfileMock = jest.fn<typeof getMyProfile>();

jest.unstable_mockModule("@/entities/profile/api/getMyProfile.api", () => ({
  getMyProfile: getMyProfileMock,
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

const PROFILE: Profile = {
  id: "profile-1",
  displayName: "이준호",
  photoUrl: null,
  role: "member",
  submittedAt: "2026-10-01T05:00:00.000Z",
  approvedAt: null,
  rejectedAt: null,
  blockedAt: null,
  leftAt: null,
  notificationsEnabled: true,
};

beforeEach(() => {
  getMyProfileMock.mockReset();
  getMyProfileMock.mockResolvedValue(PROFILE);
});

describe("useMyProfileQuery — profiles 행 하나다", () => {
  it("내 id로 읽는다", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMyProfileQuery(FAKE_CLIENT, "user-1"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data).toEqual(PROFILE));

    expect(getMyProfileMock).toHaveBeenCalledWith(FAKE_CLIENT, "user-1");
  });

  it("누구인지 모르면 안 읽는다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMyProfileQuery(FAKE_CLIENT, null), {
      wrapper,
    });

    expect(getMyProfileMock).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(true);
  });

  it("프로필 행이 아직 없으면 null이다", async () => {
    getMyProfileMock.mockResolvedValue(null);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMyProfileQuery(FAKE_CLIENT, "user-1"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data).toBeNull());
  });

  it("읽기가 넘어지면 오류가 선다", async () => {
    getMyProfileMock.mockRejectedValue(new Error("끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMyProfileQuery(FAKE_CLIENT, "user-1"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });
});
