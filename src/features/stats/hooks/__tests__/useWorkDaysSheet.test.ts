import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getMonthScheduleMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const MONTH = "2026-10";

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: {} as never,
}));

jest.unstable_mockModule(
  "@/entities/schedule/api/getMonthSchedule.api",
  () => ({
    getMonthSchedule: getMonthScheduleMock,
    getMonthWindow: jest.fn(),
    liveAssignmentCount: () => 0,
  }),
);

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useWorkDaysSheet } =
  await import("@/features/stats/hooks/useWorkDaysSheet");

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
        profileId: "p1",
        endedAt: null,
        name: "이준호",
      },
    ],
    checkIns: [],
  };
}

beforeEach(() => {
  getMonthScheduleMock.mockReset();
  getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);
});

function mounted(profileId: string) {
  const { wrapper } = createWrapper();

  return renderHook(() => useWorkDaysSheet(MONTH, profileId), { wrapper });
}

describe("useWorkDaysSheet — 조각이 그 사람의 날을 읽는다", () => {
  it("기다리는 중은 상태 이름으로 낸다", () => {
    const { result } = mounted("p1");

    expect(result.current.state).toBe("loading");
  });

  it("그 사람의 이름과 날 목록과 합계를 낸다", async () => {
    const { result } = mounted("p1");

    await waitFor(() => expect(result.current.state).toBe("ready"));

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.name).toBe("이준호");
    expect(result.current.rows).toHaveLength(1);
    expect(result.current.rows[0].title).toContain("메인");
    expect(result.current.total).toContain("1회");
  });

  it("그 달에 근무가 없는 사람은 빈 목록을 낸다", async () => {
    const { result } = mounted("p2");

    await waitFor(() => expect(result.current.state).toBe("ready"));

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.rows).toHaveLength(0);
  });

  it("읽기가 넘어지면 failed다", async () => {
    getMonthScheduleMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = mounted("p1");

    await waitFor(() => expect(result.current.state).toBe("failed"));
  });
});
