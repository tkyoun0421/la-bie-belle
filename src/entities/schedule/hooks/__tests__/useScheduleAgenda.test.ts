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
const { useScheduleAgenda } =
  await import("@/entities/schedule/hooks/useScheduleAgenda");

type Assignment = {
  id: string;
  slotId: string;
  position: string;
  kind: "regular" | "training";
  profileId: string;
  endedAt: string | null;
  name: string;
};

function dayAt(workDate: string, assignments: Assignment[] = []) {
  return {
    id: `d-${workDate}`,
    workDate,
    startsAt: "10:00:00",
    endsAt: "18:00:00",
    openedAt: "2026-09-01T00:00:00.000Z",
    slots: [{ id: `s-${workDate}`, positions: ["메인"], endedAt: null }],
    assignments,
    checkIns: [],
  };
}

function mineAt(
  workDate: string,
  kind: "regular" | "training" = "regular",
): Assignment {
  return {
    id: `a-${workDate}`,
    slotId: `s-${workDate}`,
    position: "메인",
    kind,
    profileId: "p1",
    endedAt: null,
    name: "이준호",
  };
}

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

function inputOf(expanded: string[] = [], showMineOnly = false) {
  return {
    month: "2026-10",
    myProfileId: "p1",
    showMineOnly,
    expanded,
    onToggle: jest.fn(),
    onCancelShift: jest.fn(),
    onRequestSwap: jest.fn(),
  };
}

async function mounted(expanded: string[] = [], showMineOnly = false) {
  const { wrapper } = createWrapper();
  const input = inputOf(expanded, showMineOnly);
  const hook = renderHook(() => useScheduleAgenda(input), { wrapper });

  await waitFor(() => expect(hook.result.current.state).not.toBe("pending"));

  return { ...hook, input };
}

beforeEach(() => {
  getMonthScheduleMock.mockReset();
  getMonthScheduleMock.mockResolvedValue([]);
});

describe("useScheduleAgenda — 하루마다의 글월을 controller가 완성한다", () => {
  it("열린 날이 없으면 비었다고 말한다", async () => {
    const { result } = await mounted();

    expect(result.current.state).toBe("empty");
  });

  it("날짜가 사람이 읽는 글월로 선다", async () => {
    getMonthScheduleMock.mockResolvedValue([dayAt("2026-10-03")]);

    const { result } = await mounted();

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.days[0].title).toBe("10월 3일(토)");
  });

  it("근무가 없는 날은 옅은 색으로 없다고 말한다", async () => {
    getMonthScheduleMock.mockResolvedValue([dayAt("2026-10-03")]);

    const { result } = await mounted();

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.days[0].statusLabel).toBe("근무 없음");
    expect(result.current.days[0].statusTone).toBe("subtle");
  });

  it("내 근무가 있는 날은 포지션을 브랜드 색으로 말한다", async () => {
    getMonthScheduleMock.mockResolvedValue([
      dayAt("2026-10-03", [mineAt("2026-10-03")]),
    ]);

    const { result } = await mounted();

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.days[0].statusLabel).toBe("메인");
    expect(result.current.days[0].statusTone).toBe("brand");
  });

  it("교육이면 포지션 앞에 교육이 붙는다", async () => {
    getMonthScheduleMock.mockResolvedValue([
      dayAt("2026-10-03", [mineAt("2026-10-03", "training")]),
    ]);

    const { result } = await mounted();

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.days[0].statusLabel).toBe("교육 · 메인");
  });

  it("펼친 날만 펼쳐졌다고 말한다", async () => {
    getMonthScheduleMock.mockResolvedValue([
      dayAt("2026-10-03"),
      dayAt("2026-10-04"),
    ]);

    const { result } = await mounted(["2026-10-04"]);

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.days[0].expanded).toBe(false);
    expect(result.current.days[1].expanded).toBe(true);
  });

  it("첫 날에는 구분선이 없고 그 뒤에는 있다", async () => {
    getMonthScheduleMock.mockResolvedValue([
      dayAt("2026-10-03"),
      dayAt("2026-10-04"),
    ]);

    const { result } = await mounted();

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.days[0].divider).toBe(false);
    expect(result.current.days[1].divider).toBe(true);
  });

  it("손마다 그 날을 달고 밖으로 넘긴다", async () => {
    getMonthScheduleMock.mockResolvedValue([dayAt("2026-10-03")]);

    const { result, input } = await mounted();

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    result.current.days[0].toggle();
    result.current.days[0].cancelShift();
    result.current.days[0].requestSwap();

    expect(input.onToggle).toHaveBeenCalledWith("2026-10-03");
    expect(input.onCancelShift).toHaveBeenCalledWith("2026-10-03");
    expect(input.onRequestSwap).toHaveBeenCalledWith("2026-10-03");
  });
});

describe("useScheduleAgenda — 조각이 자기 달을 부른다", () => {
  it("받은 달을 자기가 부른다", async () => {
    await mounted();

    expect(getMonthScheduleMock).toHaveBeenCalledWith(
      expect.anything(),
      "2026-10",
    );
  });

  it("기다리는 동안은 상태 이름이 pending이다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useScheduleAgenda(inputOf()), {
      wrapper,
    });

    expect(result.current.state).toBe("pending");
  });

  it("못 불러오면 상태 이름이 failed다", async () => {
    getMonthScheduleMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted();

    expect(result.current.state).toBe("failed");
  });

  it("「내 근무만」이 남의 날을 지운다", async () => {
    getMonthScheduleMock.mockResolvedValue([
      dayAt("2026-10-17", [mineAt("2026-10-17")]),
      dayAt("2026-10-20"),
    ]);

    const all = await mounted();
    const mine = await mounted([], true);

    if (all.result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    if (mine.result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(all.result.current.days).toHaveLength(2);
    expect(mine.result.current.days).toHaveLength(1);
    expect(mine.result.current.days[0].workDate).toBe("2026-10-17");
  });
});
