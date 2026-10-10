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
const { useAdminStatsWork } =
  await import("@/features/stats/hooks/useAdminStatsWork");

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
  getMonthScheduleMock.mockResolvedValue([]);
});

function mounted() {
  const { wrapper } = createWrapper();

  return renderHook(() => useAdminStatsWork(MONTH), { wrapper });
}

describe("useAdminStatsWork — 조각이 그 달의 근무를 읽는다", () => {
  it("기다리는 중은 상태 이름으로 낸다", () => {
    const { result } = mounted();

    expect(result.current.state).toBe("pending");
  });

  it("근무표가 없으면 empty다", async () => {
    const { result } = mounted();

    await waitFor(() => expect(result.current.state).toBe("empty"));
  });

  it("사람별과 포지션별 줄을 낸다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);

    const { result } = mounted();

    await waitFor(() => expect(result.current.state).toBe("ready"));

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.peopleRows).toHaveLength(1);
    expect(result.current.peopleRows[0].displayName).toBe("이준호");
    expect(result.current.peopleRows[0].profileId).toBe("p1");
    expect(result.current.positionRows.length).toBeGreaterThan(0);
    expect(result.current.totalLabel).toBeTruthy();
    expect(result.current.countLine).toContain("1");
  });

  it("근무가 없는 포지션은 값을 흐리게 든다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);

    const { result } = mounted();

    await waitFor(() => expect(result.current.state).toBe("ready"));

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    const idle = result.current.positionRows.filter(
      (row) => row.valueTone === "zero",
    );

    expect(idle.length).toBeGreaterThan(0);
  });

  it("읽기가 넘어지면 failed다", async () => {
    getMonthScheduleMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = mounted();

    await waitFor(() => expect(result.current.state).toBe("failed"));
  });
});
