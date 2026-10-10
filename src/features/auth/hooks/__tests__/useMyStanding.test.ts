import { jest } from "@jest/globals";
import type { DB } from "@/shared/api/database";
import type { Profile } from "@/entities/profile/model/profile.type";
import type { SessionUser } from "@/entities/session/model/session.type";

type SessionUserResult = {
  data: SessionUser | null | undefined;
  isLoading: boolean;
};

type MyProfileRowResult = {
  data: Profile | null | undefined;
  error: Error | null;
  isLoading: boolean;
};

const useSessionUserQueryMock = jest.fn<(client: DB) => SessionUserResult>();
const useMyProfileRowQueryMock =
  jest.fn<(client: DB, userId: string | null) => MyProfileRowResult>();

jest.unstable_mockModule(
  "@/entities/session/services/useSessionUserQuery",
  () => ({ useSessionUserQuery: useSessionUserQueryMock }),
);

jest.unstable_mockModule(
  "@/entities/profile/services/useMyProfileRowQuery",
  () => ({ useMyProfileRowQuery: useMyProfileRowQueryMock }),
);

const { renderHook } = await import("@testing-library/react-native");
const { useMyStanding } = await import("@/features/auth/hooks/useMyStanding");

const FAKE_CLIENT = {} as DB;

const SESSION_USER: SessionUser = {
  id: "user-1",
  email: "worker@example.com",
  googlePhotoUrl: null,
};

const WORKER_PROFILE: Profile = {
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

beforeEach(() => {
  useSessionUserQueryMock
    .mockReset()
    .mockReturnValue({ data: SESSION_USER, isLoading: false });
  useMyProfileRowQueryMock
    .mockReset()
    .mockReturnValue({ data: WORKER_PROFILE, error: null, isLoading: false });
});

describe("useMyStanding — 세션과 프로필 두 겹이 그대로 실린다", () => {
  it("세션의 user와 프로필 데이터가 결과에 선다", () => {
    const { result } = renderHook(() => useMyStanding(FAKE_CLIENT));

    expect(result.current.user).toEqual(SESSION_USER);
    expect(result.current.profile).toEqual(WORKER_PROFILE);
  });

  it("프로필은 세션이 알려준 userId로 읽는다", () => {
    renderHook(() => useMyStanding(FAKE_CLIENT));

    expect(useMyProfileRowQueryMock).toHaveBeenCalledWith(
      FAKE_CLIENT,
      SESSION_USER.id,
    );
  });
});

describe("useMyStanding — role·isAdmin이 프로필에서 나온다", () => {
  it("관리자를 센다", () => {
    useMyProfileRowQueryMock.mockReturnValue({
      data: { ...WORKER_PROFILE, role: "admin" },
      error: null,
      isLoading: false,
    });

    const { result } = renderHook(() => useMyStanding(FAKE_CLIENT));

    expect(result.current.role).toBe("admin");
    expect(result.current.isAdmin).toBe(true);
  });

  it("근무자를 센다", () => {
    useMyProfileRowQueryMock.mockReturnValue({
      data: { ...WORKER_PROFILE, role: "worker" },
      error: null,
      isLoading: false,
    });

    const { result } = renderHook(() => useMyStanding(FAKE_CLIENT));

    expect(result.current.role).toBe("worker");
    expect(result.current.isAdmin).toBe(false);
  });
});

describe("useMyStanding — 행이 없는 것과 아직 안 온 것이 안 접힌다", () => {
  it("프로필 행이 없으면 null이 그대로 실린다", () => {
    useMyProfileRowQueryMock.mockReturnValue({
      data: null,
      error: null,
      isLoading: false,
    });

    const { result } = renderHook(() => useMyStanding(FAKE_CLIENT));

    expect(result.current.profile).toBeNull();
    expect(result.current.role).toBeUndefined();
  });

  it("프로필이 아직 안 왔으면 undefined가 그대로 실린다", () => {
    useMyProfileRowQueryMock.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
    });

    const { result } = renderHook(() => useMyStanding(FAKE_CLIENT));

    expect(result.current.profile).toBeUndefined();
  });
});

describe("useMyStanding — 사용자가 없으면 기다릴 프로필도 없다", () => {
  it("세션을 묻는 동안은 기다린다", () => {
    useSessionUserQueryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useMyStanding(FAKE_CLIENT));

    expect(result.current.isLoading).toBe(true);
  });

  it("세션이 비면 프로필이 안 왔어도 기다리지 않는다", () => {
    useSessionUserQueryMock.mockReturnValue({ data: null, isLoading: false });
    useMyProfileRowQueryMock.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
    });

    const { result } = renderHook(() => useMyStanding(FAKE_CLIENT));

    expect(result.current.isLoading).toBe(false);
  });
});
