import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getCurrentUserMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMyProfileMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getProfilePrivateMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const listQualificationsMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const countUnreadMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const signOutMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

const pushMock = jest.fn();
const replaceMock = jest.fn();

jest.unstable_mockModule("expo-router", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
  usePathname: () => "/me",
}));

jest.unstable_mockModule("@/entities/session/api/getCurrentUser.api", () => ({
  getCurrentUser: getCurrentUserMock,
}));

jest.unstable_mockModule("@/entities/profile/api/getMyProfile.api", () => ({
  getMyProfile: getMyProfileMock,
}));

jest.unstable_mockModule("@/entities/profile/api/profilePrivate.api", () => ({
  getProfilePrivate: getProfilePrivateMock,
}));

jest.unstable_mockModule("@/entities/member/api/getQualifications.api", () => ({
  getQualifications: listQualificationsMock,
}));

jest.unstable_mockModule(
  "@/entities/notification/api/countUnreadNotifications.api",
  () => ({ countUnreadNotifications: countUnreadMock }),
);

jest.unstable_mockModule("@/features/auth/lib/signOut.lib", () => ({
  DEVICE_CLEANUP_NOT_WIRED_YET: {
    deleteDeviceRow: async () => {},
    clearDeviceToken: async () => {},
  },
  signOut: signOutMock,
}));

jest.unstable_mockModule("@/shared/lib/themeStorage.lib", () => ({
  applyColorScheme: jest.fn(),
  readStoredTheme: jest.fn(async () => null),
  writeStoredTheme: jest.fn(),
}));

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { PROFILE_COPY } = await import("@/screens/profile/consts/profile.const");
const { THEME_LABEL } = await import("@/shared/consts/theme.const");
const {
  ADMIN_HOME_PATH,
  LOGIN_PATH,
  NOTIFICATIONS_PATH,
  REHEARSALS_PATH,
  STATS_PATH,
} = await import("@/shared/consts/navigation.const");
const { useProfileScreen } =
  await import("@/screens/profile/hooks/useProfileScreen");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
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

const USER = {
  id: "user-1",
  email: "someone@example.com",
  user_metadata: { avatar_url: "https://example.test/google.jpg" },
};

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
  getCurrentUserMock.mockReset().mockResolvedValue(USER);
  getMyProfileMock.mockReset().mockResolvedValue(PROFILE);
  getProfilePrivateMock.mockReset().mockResolvedValue(PRIVATE);
  listQualificationsMock.mockReset().mockResolvedValue([]);
  countUnreadMock.mockReset().mockResolvedValue(2);
  signOutMock.mockReset().mockResolvedValue(undefined);
});

async function mounted() {
  const { wrapper } = createWrapper();
  const hook = renderHook(() => useProfileScreen(), { wrapper });

  await waitFor(() => expect(hook.result.current.loading).toBe(false));

  return hook;
}

describe("useProfileScreen — 조각을 배치하고 갈 데를 든다", () => {
  it("시트가 쓸 값이 선다", async () => {
    const { result } = await mounted();

    expect(result.current.userId).toBe(USER.id);
    expect(result.current.profileId).toBe("profile-1");
    expect(result.current.phone).toBe("010-0000-0001");
  });

  it("안 읽은 알림이 있으면 종이 선다", async () => {
    const { result } = await mounted();

    expect(result.current.unread).toBe(true);
  });

  it("관리자가 아니면 관리자 모드 문이 없다", async () => {
    const { result } = await mounted();

    expect(result.current.admin).toBe(false);
    expect(result.current.rehearsal).toBe(false);
  });

  it("관리자에게는 리허설도 같이 선다", async () => {
    getMyProfileMock.mockResolvedValue({ ...PROFILE, role: "admin" });

    const { result } = await mounted();

    expect(result.current.admin).toBe(true);
    expect(result.current.rehearsal).toBe(true);
  });

  it("화면 이름은 지금 쓰는 테마의 문안이다", async () => {
    const { result } = await mounted();

    expect(result.current.themeLabel).toBe(THEME_LABEL.system);
  });
});

describe("useProfileScreen — 조각이 쓸 것을 교통정리한다", () => {
  it("조각에 넘길 임자를 다 쥐고 있다", async () => {
    const { result } = await mounted();

    expect(result.current.userId).toBe("user-1");
    expect(result.current.profileId).toBe("profile-1");
    expect(result.current.googlePhotoUrl).toBe(
      "https://example.test/google.jpg",
    );
  });

  it("프로필을 읽기 전에는 알림이 켜졌는지 모른다고 한다", () => {
    getMyProfileMock.mockImplementation(() => new Promise(() => {}));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useProfileScreen(), { wrapper });

    expect(result.current.notificationEnabled).toBeNull();
  });

  it("읽고 나면 켜졌는지를 그대로 내려준다", async () => {
    const { result } = await mounted();

    expect(result.current.notificationEnabled).toBe(true);
  });
});

describe("useProfileScreen — 시트는 한 번에 하나다", () => {
  it("연락처를 열면 연락처 시트만 선다", async () => {
    const { result } = await mounted();

    act(() => result.current.openContact());

    expect(result.current.sheet).toBe("contact");
  });

  it("사진과 화면도 각자 자기 시트를 연다", async () => {
    const { result } = await mounted();

    act(() => result.current.openPhoto());
    expect(result.current.sheet).toBe("photo");

    act(() => result.current.openTheme());
    expect(result.current.sheet).toBe("theme");
  });

  it("닫으면 아무 시트도 안 선다", async () => {
    const { result } = await mounted();

    act(() => result.current.openTheme());
    act(() => result.current.closeSheet());

    expect(result.current.sheet).toBeNull();
  });

  it("연락처를 바꾸고 나면 시트가 닫히고 토스트가 선다", async () => {
    const { result } = await mounted();

    act(() => result.current.openContact());
    act(() => result.current.savedContact());

    expect(result.current.toast).toBe(PROFILE_COPY.contactSaved);
    expect(result.current.sheet).toBeNull();
  });

  it("사진을 바꾸고 나면 사진을 바꿨다고 한다", async () => {
    const { result } = await mounted();

    act(() => result.current.openPhoto());
    act(() => result.current.savedPhoto());

    expect(result.current.toast).toBe(PROFILE_COPY.photoSaved);
    expect(result.current.sheet).toBeNull();
  });

  it("토스트는 지울 수 있다", async () => {
    const { result } = await mounted();

    act(() => result.current.savedPhoto());
    act(() => result.current.dismissToast());

    expect(result.current.toast).toBeNull();
  });
});

describe("useProfileScreen — 로그아웃", () => {
  it("로그아웃하면 끝나고 로그인으로 보낸다", async () => {
    const { result } = await mounted();

    act(() => result.current.leave());

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith(LOGIN_PATH));
  });
});

describe("useProfileScreen — 갈 데를 controller가 정한다", () => {
  beforeEach(() => {
    pushMock.mockClear();
    replaceMock.mockClear();
  });

  it("알림으로 갈 때 지금 있는 자리를 실어 보낸다", async () => {
    const { result } = await mounted();

    act(() => result.current.goNotifications());

    expect(pushMock).toHaveBeenCalledWith(`${NOTIFICATIONS_PATH}?from=/me`);
  });

  it("통계와 리허설과 관리자 모드는 그 경로로 민다", async () => {
    const { result } = await mounted();

    act(() => result.current.goStats());
    act(() => result.current.goRehearsals());
    act(() => result.current.goAdmin());

    expect(pushMock).toHaveBeenNthCalledWith(1, STATS_PATH);
    expect(pushMock).toHaveBeenNthCalledWith(2, REHEARSALS_PATH);
    expect(pushMock).toHaveBeenNthCalledWith(3, ADMIN_HOME_PATH);
  });

  it("로그인으로는 바꿔 넣는다", async () => {
    const { result } = await mounted();

    act(() => result.current.goLogin());

    expect(replaceMock).toHaveBeenCalledWith(LOGIN_PATH);
    expect(pushMock).not.toHaveBeenCalled();
  });
});
