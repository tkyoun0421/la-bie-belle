import { jest } from "@jest/globals";
import type { DB } from "@/shared/api/database";
import type { MyProfile } from "@/entities/profile/model/profile.type";
import type { SessionUser } from "@/entities/session/model/session.type";

type SessionUserResult = {
  data: SessionUser | null | undefined;
  isLoading: boolean;
};

type MyProfileResult = {
  data: MyProfile | undefined;
  error: Error | null;
  isLoading: boolean;
};

const useSessionUserQueryMock = jest.fn<(client: DB) => SessionUserResult>();
const useMyProfileQueryMock =
  jest.fn<(client: DB, userId: string | null) => MyProfileResult>();

jest.unstable_mockModule(
  "@/entities/session/services/useSessionUserQuery",
  () => ({ useSessionUserQuery: useSessionUserQueryMock }),
);

jest.unstable_mockModule(
  "@/entities/profile/services/useMyProfileQuery",
  () => ({ useMyProfileQuery: useMyProfileQueryMock }),
);

const { renderHook } = await import("@testing-library/react-native");
const { useMyStanding } =
  // @ts-expect-error 대상 모듈이 아직 없다
  await import("@/features/auth/hooks/useMyStanding");

const FAKE_CLIENT = {} as DB;

const SESSION_USER: SessionUser = {
  id: "user-1",
  email: "worker@example.com",
  googlePhotoUrl: null,
};

const WORKER_PROFILE: MyProfile = {
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
  email: "worker@example.com",
  phone: "010-0000-0001",
  birthDate: "1993-04-21",
  gender: "male",
};

beforeEach(() => {
  useSessionUserQueryMock
    .mockReset()
    .mockReturnValue({ data: SESSION_USER, isLoading: false });
  useMyProfileQueryMock
    .mockReset()
    .mockReturnValue({ data: WORKER_PROFILE, error: null, isLoading: false });
});

describe("useMyStanding — 세션과 프로필 두 겹이 그대로 실린다", () => {
  it("세션의 user와 프로필 데이터가 결과에 선다", () => {
    const { result } = renderHook(() => useMyStanding(FAKE_CLIENT));

    expect(result.current.user).toEqual(SESSION_USER);
    expect(result.current.profile).toEqual(WORKER_PROFILE);
  });
});

describe("useMyStanding — role·isAdmin이 프로필에서 나온다", () => {
  it("관리자를 센다", () => {
    useMyProfileQueryMock.mockReturnValue({
      data: { ...WORKER_PROFILE, role: "admin" },
      error: null,
      isLoading: false,
    });

    const { result } = renderHook(() => useMyStanding(FAKE_CLIENT));

    expect(result.current.role).toBe("admin");
    expect(result.current.isAdmin).toBe(true);
  });

  it("근무자를 센다", () => {
    useMyProfileQueryMock.mockReturnValue({
      data: { ...WORKER_PROFILE, role: "worker" },
      error: null,
      isLoading: false,
    });

    const { result } = renderHook(() => useMyStanding(FAKE_CLIENT));

    expect(result.current.role).toBe("worker");
    expect(result.current.isAdmin).toBe(false);
  });
});
