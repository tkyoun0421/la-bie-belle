import { jest } from "@jest/globals";
import type { User } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import type { getMyProfile } from "@/entities/profile/api/getMyProfile.api";
import type { Profile } from "@/entities/profile/model/profile.type";
import type { getMonthSchedule } from "@/entities/schedule/api/getMonthSchedule.api";
import type { getCurrentUser } from "@/entities/session/api/getCurrentUser.api";

const getCurrentUserMock = jest.fn<typeof getCurrentUser>();
const getMyProfileMock = jest.fn<typeof getMyProfile>();
const getMonthScheduleMock = jest.fn<typeof getMonthSchedule>();

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

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useStatsPositions } =
  await import("@/features/stats/hooks/useStatsPositions");

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

  getCurrentUserMock.mockResolvedValue(SESSION_USER);
  getMyProfileMock.mockResolvedValue(MY_PROFILE);
  getMonthScheduleMock.mockResolvedValue([]);
});

function mounted() {
  const { wrapper } = createWrapper();

  return renderHook(() => useStatsPositions(MONTH), { wrapper });
}

describe("useStatsPositions — 조각이 자기 포지션을 읽는다", () => {
  it("기다리는 중은 상태 이름으로 낸다", () => {
    const { result } = mounted();

    expect(result.current.state).toBe("pending");
  });

  it("내 근무가 없으면 empty다", async () => {
    const { result } = mounted();

    await waitFor(() => expect(result.current.state).toBe("empty"));
  });

  it("포지션 줄과 합계를 낸다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);

    const { result } = mounted();

    await waitFor(() => expect(result.current.state).toBe("ready"));

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.rows).toHaveLength(1);
    expect(result.current.rows[0].title).toBe("메인");
    expect(result.current.totalLabel).toBeTruthy();
  });

  it("읽기가 넘어지면 failed다", async () => {
    getMonthScheduleMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = mounted();

    await waitFor(() => expect(result.current.state).toBe("failed"));
  });

  it("그 달 근무는 있어도 내 몫이 없으면 집계값(totalCount)으로 empty를 잰다", async () => {
    getMonthScheduleMock.mockResolvedValue([
      {
        id: "day-2026-10-02",
        workDate: "2026-10-02",
        startsAt: "18:00:00",
        endsAt: "23:00:00",
        openedAt: "2026-10-02T00:00:00.000Z",
        slots: [],
        assignments: [
          {
            id: "assign-other",
            slotId: null,
            position: "메인",
            kind: "regular",
            profileId: "other",
            endedAt: null,
            name: null,
          },
        ],
        checkIns: [],
      },
    ]);

    const { result } = mounted();

    await waitFor(() => expect(result.current.state).toBe("empty"));
  });
});
