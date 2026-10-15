import { jest } from "@jest/globals";
import type { User } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import type { getMonthAttendance } from "@/entities/attendance/api/getMonthAttendance.api";
import type { getMyProfile } from "@/entities/profile/api/getMyProfile.api";
import type { Profile } from "@/entities/profile/model/profile.type";
import type { getMonthSchedule } from "@/entities/schedule/api/getMonthSchedule.api";
import type { getCurrentUser } from "@/entities/session/api/getCurrentUser.api";

const getCurrentUserMock = jest.fn<typeof getCurrentUser>();
const getMyProfileMock = jest.fn<typeof getMyProfile>();
const getMonthScheduleMock = jest.fn<typeof getMonthSchedule>();
const getMonthAttendanceMock = jest.fn<typeof getMonthAttendance>();

const MONTH = "2026-10";

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: {} as never,
}));

jest.unstable_mockModule("@/entities/session/api/getCurrentUser.api", () => ({
  getCurrentUser: getCurrentUserMock,
}));

jest.unstable_mockModule("@/entities/profile/api/getMyProfile.api", () => ({
  getMyProfile: getMyProfileMock,
}));

jest.unstable_mockModule(
  "@/entities/schedule/api/getMonthSchedule.api",
  () => ({
    getMonthSchedule: getMonthScheduleMock,
    getMonthWindow: jest.fn(),
  }),
);

jest.unstable_mockModule(
  "@/entities/attendance/api/getMonthAttendance.api",
  () => ({ getMonthAttendance: getMonthAttendanceMock }),
);

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useStatsAttendance } =
  await import("@/features/stats/hooks/useStatsAttendance");

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

const EMPTY_ATTENDANCE = { checkIns: [], excuseStatuses: [] };

function scheduleDay(workDate: string) {
  return {
    id: `day-${workDate}`,
    workDate,
    startsAt: "18:00:00",
    endsAt: "23:00:00",
    openedAt: `${workDate}T00:00:00.000Z`,
    slots: [],
    assignments: [
      {
        id: `assign-${workDate}`,
        slotId: null,
        position: "메인",
        kind: "regular",
        profileId: "me",
        endedAt: null,
        name: null,
      },
    ],
    checkIns: [],
  };
}

const SESSION_USER: User = {
  id: "user-1",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2026-01-01T00:00:00.000Z",
};

const MY_PROFILE: Profile = {
  id: "me",
  displayName: "이준호",
  photoUrl: null,
  role: "member",
  submittedAt: "2026-01-01T00:00:00.000Z",
  approvedAt: "2026-01-02T00:00:00.000Z",
  rejectedAt: null,
  blockedAt: null,
  leftAt: null,
  notificationsEnabled: true,
};

beforeEach(() => {
  getCurrentUserMock.mockReset();
  getMyProfileMock.mockReset();
  getMonthScheduleMock.mockReset();
  getMonthAttendanceMock.mockReset();

  getCurrentUserMock.mockResolvedValue(SESSION_USER);
  getMyProfileMock.mockResolvedValue(MY_PROFILE);
  getMonthScheduleMock.mockResolvedValue([]);
  getMonthAttendanceMock.mockResolvedValue(EMPTY_ATTENDANCE);
});

function mounted() {
  const { wrapper } = createWrapper();

  return renderHook(() => useStatsAttendance(MONTH), { wrapper });
}

describe("useStatsAttendance — 조각이 자기 근태를 읽는다", () => {
  it("기다리는 중은 상태 이름으로 낸다", () => {
    const { result } = mounted();

    expect(result.current.state).toBe("pending");
  });

  it("내 근무가 없으면 empty다", async () => {
    const { result } = mounted();

    await waitFor(() => expect(result.current.state).toBe("empty"));
  });

  it("날짜 목록과 현황 줄과 비율 띠를 낸다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);

    const { result } = mounted();

    await waitFor(() => expect(result.current.state).toBe("ready"));

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.rows).toHaveLength(1);
    expect(result.current.rows[0].title).toBeTruthy();
    expect(result.current.line).toBeTruthy();
    expect(result.current.shares).toHaveLength(4);
  });

  it("읽기가 넘어지면 failed다", async () => {
    getMonthAttendanceMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = mounted();

    await waitFor(() => expect(result.current.state).toBe("failed"));
  });
});
