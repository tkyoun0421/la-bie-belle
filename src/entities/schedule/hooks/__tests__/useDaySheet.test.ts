import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const TODAY = "2026-10-03";

const getMonthScheduleMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: {} as never,
}));

jest.unstable_mockModule("@/shared/lib/kstToday.lib", () => ({
  kstToday: () => TODAY,
}));

jest.unstable_mockModule(
  "@/entities/schedule/api/getMonthSchedule.api",
  () => ({
    getMonthSchedule: getMonthScheduleMock,
  }),
);

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useDaySheet } = await import("@/entities/schedule/hooks/useDaySheet");

const MY_DAY = {
  id: "d1",
  workDate: "2026-10-17",
  startsAt: "10:00:00",
  endsAt: "18:00:00",
  openedAt: "2026-09-01T00:00:00.000Z",
  slots: [
    { id: "s1", positions: ["안내"], endedAt: null },
    { id: "s2", positions: ["서빙"], endedAt: null },
  ],
  assignments: [
    {
      id: "a1",
      slotId: "s1",
      position: "안내",
      kind: "regular",
      profileId: "p1",
      endedAt: null,
      name: "이준호",
    },
  ],
  checkIns: [],
};

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

function inputOf(extra: Record<string, unknown> = {}) {
  return {
    workDate: "2026-10-17",
    myProfileId: "p1",
    cancelRequested: false,
    onCancelShift: jest.fn(),
    onRequestSwap: jest.fn(),
    ...extra,
  };
}

async function mounted(extra: Record<string, unknown> = {}) {
  const { wrapper } = createWrapper();
  const input = inputOf(extra);
  const hook = renderHook(() => useDaySheet(input), { wrapper });

  await waitFor(() => expect(hook.result.current.state).not.toBe("pending"));

  return { ...hook, input };
}

beforeEach(() => {
  getMonthScheduleMock.mockReset();
  getMonthScheduleMock.mockResolvedValue([MY_DAY]);
});

describe("useDaySheet — 명단 조각이 자기 날을 불러온다", () => {
  it("누른 날이 든 달을 자기가 부른다", async () => {
    await mounted();

    expect(getMonthScheduleMock).toHaveBeenCalledWith(
      expect.anything(),
      "2026-10",
    );
  });

  it("기다리는 동안은 상태 이름이 pending이다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDaySheet(inputOf()), { wrapper });

    expect(result.current.state).toBe("pending");
  });

  it("그 날의 명단을 글월로 완성해 낸다", async () => {
    const { result } = await mounted();

    expect(result.current.state).toBe("ready");

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.title).toBe("10월 17일(토)");
    expect(result.current.subtitle).toBe("10:00 – 18:00 · 1명");
    expect(result.current.rows).toHaveLength(2);
    expect(result.current.showActions).toBe(true);
    expect(result.current.actionsEnabled).toBe(true);
  });

  it("이미 요청을 걸어둔 근무는 배지가 서고 버튼이 잠긴다", async () => {
    const { result } = await mounted({ cancelRequested: true });

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.myBadge).toBe("취소 요청 중");
    expect(result.current.showActions).toBe(true);
    expect(result.current.actionsEnabled).toBe(false);
  });

  it("남의 근무면 버튼을 보이지 않는다", async () => {
    const { result } = await mounted({ myProfileId: "p9" });

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.showActions).toBe(false);
  });

  it("못 불러오면 상태 이름이 failed다", async () => {
    getMonthScheduleMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted();

    expect(result.current.state).toBe("failed");
  });

  it("질의는 성공해도 그 달에 그 날이 없으면 failed다", async () => {
    const { result } = await mounted({ workDate: "2026-10-20" });

    expect(result.current.state).toBe("failed");
  });

  it("쓰기로 들어가는 문은 받아서 그대로 넘긴다", async () => {
    const { result, input } = await mounted();

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    result.current.cancelShift();
    result.current.requestSwap();

    expect(input.onCancelShift).toHaveBeenCalled();
    expect(input.onRequestSwap).toHaveBeenCalled();
  });
});
