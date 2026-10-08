import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getCurrentUserMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMyProfileMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getProfilePrivateMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const listQualificationsMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const countUnreadMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const updateMyContactMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const updateMyPhotoMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const uploadAvatarMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const setNotificationsEnabledMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const signOutMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getPushPermissionMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const requestPushPermissionMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const pickAndShrinkPhotoMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

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

jest.unstable_mockModule(
  "@/features/profileEdit/api/updateMyContact.api",
  () => ({ updateMyContact: updateMyContactMock }),
);

jest.unstable_mockModule(
  "@/features/profileEdit/api/updateMyPhoto.api",
  () => ({
    updateMyPhoto: updateMyPhotoMock,
  }),
);

jest.unstable_mockModule(
  "@/features/profileEdit/api/avatarsBucket.api",
  () => ({ uploadAvatar: uploadAvatarMock }),
);

jest.unstable_mockModule(
  "@/features/pushSwitch/api/setNotificationsEnabled.api",
  () => ({ setNotificationsEnabled: setNotificationsEnabledMock }),
);

jest.unstable_mockModule("@/features/auth/lib/signOut.lib", () => ({
  DEVICE_CLEANUP_NOT_WIRED_YET: {
    deleteDeviceRow: async () => {},
    clearDeviceToken: async () => {},
  },
  signOut: signOutMock,
}));

jest.unstable_mockModule(
  "@/features/pushSwitch/lib/pushPermission.lib",
  () => ({
    getPushPermission: getPushPermissionMock,
    requestPushPermission: requestPushPermissionMock,
  }),
);

jest.unstable_mockModule("@/features/profileEdit/lib/pickPhoto.lib", () => ({
  pickAndShrinkPhoto: pickAndShrinkPhotoMock,
}));

jest.unstable_mockModule("@/features/pushSwitch/lib/pushDeps.lib", () => ({
  PUSH_DEPS: { getPermissionsAsync: jest.fn() },
}));

jest.unstable_mockModule(
  "@/features/profileEdit/lib/photoPickDeps.lib",
  () => ({
    PHOTO_PICK_DEPS: {},
  }),
);

jest.unstable_mockModule("@/shared/lib/appState.lib", () => ({
  APP_STATE: { addEventListener: () => ({ remove: () => {} }) },
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
const { DomainError } = await import("@/shared/model/error.type");
const { PROFILE_COPY } = await import("@/screens/profile/consts/profile.const");
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
  display_name: "이준호",
  photo_url: null,
  role: "worker",
  submitted_at: "2026-09-01T00:00:00.000Z",
  approved_at: "2026-09-02T00:00:00.000Z",
  rejected_at: null,
  blocked_at: null,
  left_at: null,
  notifications_enabled: true,
};

const PRIVATE = {
  email: "someone@example.com",
  phone: "010-0000-0001",
  birth_date: "1993-04-21",
  gender: "male",
};

beforeEach(() => {
  getCurrentUserMock.mockReset().mockResolvedValue(USER);
  getMyProfileMock.mockReset().mockResolvedValue(PROFILE);
  getProfilePrivateMock.mockReset().mockResolvedValue(PRIVATE);
  listQualificationsMock.mockReset().mockResolvedValue([]);
  countUnreadMock.mockReset().mockResolvedValue(2);
  updateMyContactMock.mockReset().mockResolvedValue(undefined);
  updateMyPhotoMock.mockReset().mockResolvedValue(undefined);
  uploadAvatarMock.mockReset().mockResolvedValue("https://example.test/up.jpg");
  setNotificationsEnabledMock.mockReset().mockResolvedValue(undefined);
  signOutMock.mockReset().mockResolvedValue(undefined);
  getPushPermissionMock.mockReset().mockResolvedValue("granted");
  requestPushPermissionMock
    .mockReset()
    .mockResolvedValue({ permission: "granted", token: "tok-1" });
  pickAndShrinkPhotoMock.mockReset().mockResolvedValue({
    uri: "file:///shrunk.jpg",
    contentType: "image/jpeg",
    extension: "jpg",
  });
});

async function mounted() {
  const { wrapper } = createWrapper();
  const hook = renderHook(() => useProfileScreen(), { wrapper });

  await waitFor(() => expect(hook.result.current.loading).toBe(false));

  return hook;
}

describe("useProfileScreen — 값 다섯을 글로 세운다", () => {
  it("이름과 역할과 값 셋이 선다", async () => {
    const { result } = await mounted();

    expect(result.current.name).toBe("이준호");
    expect(result.current.roleLabel).toBe(PROFILE_COPY.worker);
    expect(result.current.gender).toBe("남성");
    expect(result.current.birthDate).toBe("1993년 4월 21일");
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
});

describe("useProfileScreen — 시트는 한 번에 하나다", () => {
  it("연락처를 열면 적힌 번호가 숫자로 들어 있다", async () => {
    const { result } = await mounted();

    act(() => result.current.openContact());

    expect(result.current.sheet).toBe("contact");
    expect(result.current.contactDraft).toBe("01000000001");
    expect(result.current.canSaveContact).toBe(false);
  });

  it("고치면 저장할 수 있다", async () => {
    const { result } = await mounted();

    act(() => result.current.openContact());
    act(() => result.current.writeContact("01000000002"));

    expect(result.current.canSaveContact).toBe(true);

    act(() => result.current.saveContact());

    await waitFor(() =>
      expect(updateMyContactMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        "profile-1",
        "010-0000-0002",
      ),
    );
  });

  it("저장하면 시트가 닫히고 토스트가 선다", async () => {
    const { result } = await mounted();

    act(() => result.current.openContact());
    act(() => result.current.writeContact("01000000002"));
    act(() => result.current.saveContact());

    await waitFor(() =>
      expect(result.current.toast).toBe(PROFILE_COPY.contactSaved),
    );

    expect(result.current.sheet).toBeNull();
  });

  it("서버가 꼴을 물리면 시트를 연 채로 그 말을 한다", async () => {
    updateMyContactMock.mockRejectedValue(new DomainError("invalid_phone"));

    const { result } = await mounted();

    act(() => result.current.openContact());
    act(() => result.current.writeContact("01000000002"));
    act(() => result.current.saveContact());

    await waitFor(() => expect(result.current.contactRejected).toBe(true));

    expect(result.current.contactFailed).toBe(false);
    expect(result.current.sheet).toBe("contact");
  });

  it("통신이 끊기면 「보내지 못했어요」다", async () => {
    updateMyContactMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted();

    act(() => result.current.openContact());
    act(() => result.current.writeContact("01000000002"));
    act(() => result.current.saveContact());

    await waitFor(() => expect(result.current.contactFailed).toBe(true));

    expect(result.current.contactRejected).toBe(false);
  });

  it("화면 시트에서 고르면 바로 닫힌다", async () => {
    const { result } = await mounted();

    act(() => result.current.openTheme());
    act(() => result.current.chooseTheme("dark"));

    expect(result.current.sheet).toBeNull();
    expect(result.current.theme).toBe("dark");
  });
});

describe("useProfileScreen — 사진", () => {
  it("구글 사진이 있고 내 사진이 없으면 권한다", async () => {
    const { result } = await mounted();

    act(() => result.current.openPhoto());

    expect(result.current.offerGoogle).toBe(true);
  });

  it("고른 사진은 올려 앉힌다", async () => {
    const { result } = await mounted();

    act(() => result.current.openPhoto());
    act(() => void result.current.pickPhoto());

    await waitFor(() =>
      expect(uploadAvatarMock).toHaveBeenCalledWith(FAKE_CLIENT, {
        userId: "user-1",
        uri: "file:///shrunk.jpg",
        contentType: "image/jpeg",
        extension: "jpg",
      }),
    );

    await waitFor(() =>
      expect(result.current.toast).toBe(PROFILE_COPY.photoSaved),
    );
  });

  it("고르다 말면 아무 일도 없다", async () => {
    pickAndShrinkPhotoMock.mockResolvedValue(null);

    const { result } = await mounted();

    act(() => result.current.openPhoto());
    await act(async () => {
      await result.current.pickPhoto();
    });

    expect(uploadAvatarMock).not.toHaveBeenCalled();
    expect(result.current.photoFailed).toBe(false);
    expect(result.current.sheet).toBe("photo");
  });

  it("고르다 넘어지면 시트 안에 실패가 선다", async () => {
    pickAndShrinkPhotoMock.mockRejectedValue(new Error("못 줄였다"));

    const { result } = await mounted();

    act(() => result.current.openPhoto());
    await act(async () => {
      await result.current.pickPhoto();
    });

    expect(result.current.photoFailed).toBe(true);
    expect(result.current.sheet).toBe("photo");
  });

  it("구글 사진은 올릴 것 없이 앉힌다", async () => {
    const { result } = await mounted();

    act(() => result.current.openPhoto());
    act(() => result.current.useGooglePhoto());

    await waitFor(() =>
      expect(updateMyPhotoMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        "https://example.test/google.jpg",
      ),
    );

    expect(uploadAvatarMock).not.toHaveBeenCalled();
  });
});

describe("useProfileScreen — 알림과 로그아웃", () => {
  it("권한이 허락이면 스위치가 선다", async () => {
    const { result } = await mounted();

    await waitFor(() =>
      expect(result.current.notificationRow.kind).toBe("switch"),
    );

    expect(result.current.notificationEnabled).toBe(true);
  });

  it("거부된 기기에는 스위치 대신 안내가 선다", async () => {
    getPushPermissionMock.mockResolvedValue("denied");

    const { result } = await mounted();

    await waitFor(() =>
      expect(result.current.notificationRow.kind).toBe("notice"),
    );
  });

  it("끄기는 묻고 나서 보낸다", async () => {
    const { result } = await mounted();

    act(() => result.current.askTurnOff());

    expect(result.current.turningOff).toBe(true);
    expect(setNotificationsEnabledMock).not.toHaveBeenCalled();

    act(() => result.current.confirmTurnOff());

    expect(result.current.turningOff).toBe(false);

    await waitFor(() =>
      expect(setNotificationsEnabledMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        false,
      ),
    );
  });

  it("묻다 말면 안 보낸다", async () => {
    const { result } = await mounted();

    act(() => result.current.askTurnOff());
    act(() => result.current.cancelTurnOff());

    expect(result.current.turningOff).toBe(false);
    expect(setNotificationsEnabledMock).not.toHaveBeenCalled();
  });

  it("로그아웃하면 끝나고 부르는 쪽이 보낼 데를 정한다", async () => {
    const { result } = await mounted();
    const onDone = jest.fn();

    act(() => result.current.signOut(onDone));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });
});
