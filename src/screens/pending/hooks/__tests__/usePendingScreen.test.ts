import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/screens/pending/hooks/usePendingScreen.ts
//
// 한 경로가 장면 넷을 드는 화면의 controller다. `.tsx`가 684줄에 `useState` 열하나를 들고
// 세션과 프로필을 제 `useEffect`로 읽고, 보내기와 사진 올리기를 `async` 손으로 직접 했다.
//
// **칸은 하나고 자리가 고정이다.** 열려 있는 칸은 「굳은 것」에서 계산된다.
//
// **축하는 계정마다 한 번이다.** 거절 뒤 다시 보낸 것이면 축하 없이 바로 승인 대기다.

const getCurrentUserMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMyProfileMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getProfilePrivateMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const submitProfileMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const uploadAvatarMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const updateMyPhotoMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const signOutMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
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

jest.unstable_mockModule(
  "@/features/profileEdit/api/submitProfile.api",
  () => ({
    submitProfile: submitProfileMock,
  }),
);

jest.unstable_mockModule(
  "@/features/profileEdit/api/avatarsBucket.api",
  () => ({
    uploadAvatar: uploadAvatarMock,
  }),
);

jest.unstable_mockModule(
  "@/features/profileEdit/api/updateMyPhoto.api",
  () => ({
    updateMyPhoto: updateMyPhotoMock,
  }),
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
    getPushPermission: jest.fn(),
    requestPushPermission: requestPushPermissionMock,
  }),
);

jest.unstable_mockModule("@/features/profileEdit/lib/pickPhoto.lib", () => ({
  pickAndShrinkPhoto: pickAndShrinkPhotoMock,
}));

jest.unstable_mockModule("@/features/pushSwitch/lib/pushDeps.lib", () => ({
  PUSH_DEPS: {},
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

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { PENDING_FORM_COPY } =
  await import("@/screens/pending/consts/pending.const");
const { usePendingScreen } =
  await import("@/screens/pending/hooks/usePendingScreen");

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

const FAKE_CLIENT = {} as never;

const USER = {
  id: "user-1",
  email: "someone@example.com",
  user_metadata: { avatar_url: "https://example.test/google.jpg" },
};

const BLANK_PROFILE = {
  id: "profile-1",
  display_name: null,
  photo_url: null,
  role: "worker",
  submitted_at: null,
  approved_at: null,
  rejected_at: null,
  blocked_at: null,
  left_at: null,
  notifications_enabled: false,
};

beforeEach(() => {
  getCurrentUserMock.mockReset().mockResolvedValue(USER);
  getMyProfileMock.mockReset().mockResolvedValue(BLANK_PROFILE);
  getProfilePrivateMock.mockReset().mockResolvedValue(null);
  submitProfileMock.mockReset().mockResolvedValue(undefined);
  uploadAvatarMock.mockReset().mockResolvedValue("https://example.test/up.jpg");
  updateMyPhotoMock.mockReset().mockResolvedValue(undefined);
  signOutMock.mockReset().mockResolvedValue(undefined);
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
  const hook = renderHook(() => usePendingScreen(FAKE_CLIENT), { wrapper });

  await waitFor(() => expect(hook.result.current.stage).not.toBe("loading"));

  return hook;
}

async function filled() {
  const hook = await mounted();
  const { result } = hook;

  act(() => result.current.freezePhoto());
  act(() => result.current.writeName("이준호"));
  act(() => result.current.submitName());
  act(() => result.current.chooseGender("male"));
  act(() => result.current.writeBirthDate("19930421"));
  act(() => result.current.writePhone("01000000001"));

  return hook;
}

describe("usePendingScreen — 장면이 넷이다", () => {
  it("읽기 전에는 loading이다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePendingScreen(FAKE_CLIENT), {
      wrapper,
    });

    expect(result.current.stage).toBe("loading");
  });

  it("세션이 없으면 signedOut이다", async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const { result } = await mounted();

    expect(result.current.stage).toBe("signedOut");
  });

  it("안 보냈으면 적는 자리고 사진부터 묻는다", async () => {
    const { result } = await mounted();

    expect(result.current.stage).toBe("form");
    expect(result.current.open).toBe("photo");
    expect(result.current.email).toBe("someone@example.com");
  });

  it("보냈으면 기다리는 중이고 적은 것이 다 굳어 있다", async () => {
    getMyProfileMock.mockResolvedValue({
      ...BLANK_PROFILE,
      display_name: "이준호",
      submitted_at: "2026-10-01T00:00:00.000Z",
    });
    getProfilePrivateMock.mockResolvedValue({
      email: "someone@example.com",
      phone: "010-0000-0001",
      birth_date: "1993-04-21",
      gender: "male",
    });

    const { result } = await mounted();

    expect(result.current.stage).toBe("waiting");
    expect(result.current.open).toBeNull();
    expect(result.current.phoneLine).toBe("010-0000-0001");
    expect(result.current.birthDateLine).toBe("1993년 4월 21일");
  });

  it("거절된 뒤에는 고쳐서 다시 보낼 수 있다", async () => {
    getMyProfileMock.mockResolvedValue({
      ...BLANK_PROFILE,
      display_name: "이준호",
      submitted_at: "2026-10-01T00:00:00.000Z",
      rejected_at: "2026-10-02T00:00:00.000Z",
    });

    const { result } = await mounted();

    expect(result.current.stage).toBe("rejected");

    act(() => result.current.retry());

    expect(result.current.stage).toBe("form");
  });
});

describe("usePendingScreen — 칸은 하나고 자리가 고정이다", () => {
  it("굳으면 다음 칸이 열린다", async () => {
    const { result } = await mounted();

    act(() => result.current.freezePhoto());

    expect(result.current.open).toBe("name");

    act(() => result.current.writeName("이준호"));
    act(() => result.current.submitName());

    expect(result.current.open).toBe("gender");
    expect(result.current.nameLine).toBe(
      `이준호${PENDING_FORM_COPY.greetingSuffix}`,
    );
  });

  it("빈 이름으로는 안 굳는다", async () => {
    const { result } = await mounted();

    act(() => result.current.freezePhoto());
    act(() => result.current.writeName("   "));
    act(() => result.current.submitName());

    expect(result.current.open).toBe("name");
  });

  it("꼴이 맞는 순간 저절로 굳는다", async () => {
    const { result } = await filled();

    expect(result.current.open).toBeNull();
    expect(result.current.canSubmit).toBe(true);
  });

  it("굳은 것을 누르면 다시 열린다", async () => {
    const { result } = await filled();

    act(() => result.current.thaw("gender"));

    expect(result.current.open).toBe("gender");
    expect(result.current.canSubmit).toBe(false);
  });

  it("칸에서 손을 떼야 틀렸다고 말한다", async () => {
    const { result } = await mounted();

    act(() => result.current.freezePhoto());
    act(() => result.current.writeName("이준호"));
    act(() => result.current.submitName());
    act(() => result.current.chooseGender("male"));
    act(() => result.current.writeBirthDate("1993"));

    expect(result.current.birthDateGuide).toBeUndefined();

    act(() => result.current.touch("birthDate"));

    expect(result.current.birthDateGuide).toBeDefined();
  });
});

describe("usePendingScreen — 보내기와 사진", () => {
  it("적은 값을 서버 꼴로 보낸다", async () => {
    const { result } = await filled();

    act(() => result.current.send());

    await waitFor(() =>
      expect(submitProfileMock).toHaveBeenCalledWith(FAKE_CLIENT, {
        displayName: "이준호",
        phone: "010-0000-0001",
        birthDate: "1993-04-21",
        gender: "male",
      }),
    );
  });

  it("처음 보내면 축하가 선다", async () => {
    const { result } = await filled();

    act(() => result.current.send());

    await waitFor(() => expect(result.current.stage).toBe("celebrating"));
  });

  it("한 번이라도 보낸 적이 있으면 축하 없이 바로 기다린다", async () => {
    getMyProfileMock.mockResolvedValue({
      ...BLANK_PROFILE,
      display_name: "이준호",
      submitted_at: "2026-10-01T00:00:00.000Z",
      rejected_at: "2026-10-02T00:00:00.000Z",
    });
    getProfilePrivateMock.mockResolvedValue({
      email: "someone@example.com",
      phone: "010-0000-0001",
      birth_date: "1993-04-21",
      gender: "male",
    });

    const { result } = await mounted();

    act(() => result.current.retry());
    act(() => result.current.send());

    await waitFor(() => expect(result.current.stage).toBe("waiting"));
  });

  it("보내기가 넘어지면 그 자리에 선다", async () => {
    submitProfileMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await filled();

    act(() => result.current.send());

    await waitFor(() => expect(result.current.submitFailed).toBe(true));

    expect(result.current.stage).toBe("form");
  });

  it("고른 사진을 올리면 사진 칸이 굳는다", async () => {
    const { result } = await mounted();

    await act(async () => {
      await result.current.pickPhoto();
    });

    await waitFor(() =>
      expect(uploadAvatarMock).toHaveBeenCalledWith(FAKE_CLIENT, {
        userId: "user-1",
        uri: "file:///shrunk.jpg",
        contentType: "image/jpeg",
        extension: "jpg",
      }),
    );

    await waitFor(() => expect(result.current.open).toBe("name"));
  });

  it("고르다 말면 칸이 그대로 열려 있다", async () => {
    pickAndShrinkPhotoMock.mockResolvedValue(null);

    const { result } = await mounted();

    await act(async () => {
      await result.current.pickPhoto();
    });

    expect(uploadAvatarMock).not.toHaveBeenCalled();
    expect(result.current.open).toBe("photo");
    expect(result.current.photoFailed).toBe(false);
  });

  it("고르다 넘어지면 실패가 선다", async () => {
    pickAndShrinkPhotoMock.mockRejectedValue(new Error("못 줄였다"));

    const { result } = await mounted();

    await act(async () => {
      await result.current.pickPhoto();
    });

    expect(result.current.photoFailed).toBe(true);
    expect(result.current.open).toBe("photo");
  });
});

describe("usePendingScreen — 알림과 로그아웃", () => {
  it("저절로 안 묻는다", async () => {
    const { result } = await mounted();

    expect(requestPushPermissionMock).not.toHaveBeenCalled();
    expect(result.current.prompt.hasButton).toBe(true);
  });

  it("누르면 묻고 켜지면 약속한다", async () => {
    const { result } = await mounted();

    await act(async () => {
      await result.current.turnOnNotifications();
    });

    expect(requestPushPermissionMock).toHaveBeenCalled();
    expect(result.current.prompt.hasButton).toBe(false);
  });

  it("거부하면 버튼이 사라진다", async () => {
    requestPushPermissionMock.mockResolvedValue({ permission: "denied" });

    const { result } = await mounted();

    await act(async () => {
      await result.current.turnOnNotifications();
    });

    expect(result.current.prompt.hasButton).toBe(false);
  });

  it("로그아웃하면 끝나고 부르는 쪽이 보낼 데를 정한다", async () => {
    const { result } = await mounted();
    const onDone = jest.fn();

    act(() => result.current.signOut(onDone));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });
});
