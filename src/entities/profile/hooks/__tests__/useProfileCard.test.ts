import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getMyProfileMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getProfilePrivateMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

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
const { PROFILE_CARD_COPY } =
  await import("@/entities/profile/consts/profile.const");
const { useProfileCard } =
  await import("@/entities/profile/hooks/useProfileCard");

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

const PROFILE = {
  id: "profile-1",
  displayName: "이준호",
  photoUrl: null,
  role: "worker",
  submittedAt: "2026-09-01T00:00:00.000Z",
  approvedAt: "2026-09-02T00:00:00.000Z",
  rejectedAt: null,
  blockedAt: null,
  leftAt: null,
  notificationsEnabled: true,
};

const PRIVATE = {
  email: "someone@example.com",
  phone: "010-0000-0001",
  birthDate: "1993-04-21",
  gender: "male",
};

beforeEach(() => {
  getMyProfileMock.mockReset().mockResolvedValue(PROFILE);
  getProfilePrivateMock.mockReset().mockResolvedValue(PRIVATE);
});

async function mounted(userId: string | null = "user-1") {
  const { wrapper } = createWrapper();
  const hook = renderHook(() => useProfileCard({ userId }), { wrapper });

  await waitFor(() => expect(hook.result.current.state).not.toBe("pending"));

  return hook;
}

describe("useProfileCard — 조각이 자기 프로필을 부른다", () => {
  it("읽기 전에는 pending이다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useProfileCard({ userId: "user-1" }), {
      wrapper,
    });

    expect(result.current.state).toBe("pending");
  });

  it("이름과 역할과 값 셋이 선다", async () => {
    const { result } = await mounted();

    expect(result.current.state).toBe("ready");

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.name).toBe("이준호");
    expect(result.current.roleLabel).toBe(PROFILE_CARD_COPY.worker);
    expect(result.current.gender).toBe("남성");
    expect(result.current.birthDate).toBe("1993년 4월 21일");
    expect(result.current.phone).toBe("010-0000-0001");
  });

  it("관리자는 역할 문안이 다르다", async () => {
    getMyProfileMock.mockResolvedValue({ ...PROFILE, role: "admin" });

    const { result } = await mounted();

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.roleLabel).toBe(PROFILE_CARD_COPY.admin);
  });

  it("못 읽으면 failed다", async () => {
    getMyProfileMock.mockRejectedValue(new Error("끊겼어요"));

    const { result } = await mounted();

    expect(result.current.state).toBe("failed");
  });

  it("누구인지 모르면 기다린다", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useProfileCard({ userId: null }), {
      wrapper,
    });

    expect(result.current.state).toBe("pending");
    expect(getMyProfileMock).not.toHaveBeenCalled();
  });
});
