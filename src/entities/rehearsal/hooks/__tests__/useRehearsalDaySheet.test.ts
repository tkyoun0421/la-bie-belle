import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getMyRehearsalsMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getAllRehearsalsMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule(
  "@/entities/rehearsal/api/getMyRehearsals.api",
  () => ({
    getMyRehearsals: getMyRehearsalsMock,
  }),
);

jest.unstable_mockModule(
  "@/entities/rehearsal/api/getAllRehearsals.api",
  () => ({ getAllRehearsals: getAllRehearsalsMock }),
);

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useRehearsalDaySheet } =
  await import("@/entities/rehearsal/hooks/useRehearsalDaySheet");

type Input = Parameters<typeof useRehearsalDaySheet>[0];

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

function rehearsal(over: Record<string, unknown>) {
  return {
    id: "r1",
    profileId: "p1",
    workDate: "2026-10-05",
    startsAt: "14:00:00",
    endsAt: "16:00:00",
    count: null,
    name: "이준호",
    ...over,
  };
}

beforeEach(() => {
  getMyRehearsalsMock.mockReset().mockResolvedValue([rehearsal({})]);
  getAllRehearsalsMock.mockReset().mockResolvedValue([rehearsal({})]);
});

async function mounted(over: Partial<Input> = {}) {
  const { wrapper } = createWrapper();
  const hook = renderHook(
    () =>
      useRehearsalDaySheet({
        workDate: "2026-10-05",
        month: "2026-10",
        isAdmin: false,
        formKind: "time",
        ...over,
      }),
    { wrapper },
  );

  await waitFor(() => expect(hook.result.current.state).not.toBe("pending"));

  return hook;
}

describe("useRehearsalDaySheet — 조각이 그 날 리허설을 부른다", () => {
  it("읽기 전에는 pending이다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        useRehearsalDaySheet({
          workDate: "2026-10-05",
          month: "2026-10",
          isAdmin: false,
          formKind: "time",
        }),
      { wrapper },
    );

    expect(result.current.state).toBe("pending");
  });

  it("못 읽으면 failed다", async () => {
    getMyRehearsalsMock.mockRejectedValue(new Error("끊겼어요"));

    const { result } = await mounted();

    expect(result.current.state).toBe("failed");
  });

  it("그 날을 제목으로 세우고 줄을 그 날 것만 든다", async () => {
    getMyRehearsalsMock.mockResolvedValue([
      rehearsal({ id: "today" }),
      rehearsal({ id: "other", workDate: "2026-10-06" }),
    ]);

    const { result } = await mounted();

    expect(result.current.state).toBe("ready");

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.title).toContain("10월 5일");
    expect(result.current.content.kind).toBe("rows");

    if (result.current.content.kind === "rows") {
      expect(result.current.content.lines.map((line) => line.id)).toEqual([
        "today",
      ]);
    }
  });

  it("넣은 것이 없으면 빈 말을 든다", async () => {
    getMyRehearsalsMock.mockResolvedValue([]);

    const { result } = await mounted();

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.content.kind).toBe("empty");
  });

  it("관리자는 모두의 리허설을 읽고 넣을 수는 없다", async () => {
    const { result } = await mounted({ isAdmin: true });

    expect(getAllRehearsalsMock).toHaveBeenCalledWith(FAKE_CLIENT, "2026-10");
    expect(getMyRehearsalsMock).not.toHaveBeenCalled();

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.canAdd).toBe(false);
  });

  it("근무하는 날은 한 건만 넣는다", async () => {
    const already = await mounted({ formKind: "count" });

    if (already.result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(already.result.current.canAdd).toBe(false);

    getMyRehearsalsMock.mockResolvedValue([]);
    const none = await mounted({ formKind: "count" });

    if (none.result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(none.result.current.canAdd).toBe(true);
  });

  it("근무하지 않는 날은 여러 번 넣는다", async () => {
    const { result } = await mounted({ formKind: "time" });

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.canAdd).toBe(true);
  });
});
