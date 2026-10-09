import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getNotificationsMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FIXED_NOW = new Date(Date.UTC(2026, 9, 3, 1, 0, 0));

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule(
  "@/entities/notification/api/getNotifications.api",
  () => ({
    getNotifications: getNotificationsMock,
  }),
);

jest.unstable_mockModule("@/entities/notification/utils/title.utils", () => ({
  toNotificationTitle: (row: { id: string }) =>
    row.id === "no-title" ? null : { title: `제목 ${row.id}` },
}));

jest.unstable_mockModule("@/entities/notification/utils/when.utils", () => ({
  toNotificationDateHeader: (date: string) => `머리 ${date}`,
  toNotificationReceivedTime: (at: string) => `시각 ${at}`,
}));

jest.unstable_mockModule(
  "@/entities/notification/model/destination.policy",
  () => ({
    toNotificationDestination: (row: { id: string }) =>
      row.id === "no-door" ? null : `/to/${row.id}`,
  }),
);

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useNotificationsList } =
  await import("@/entities/notification/hooks/useNotificationsList");

type Input = Parameters<typeof useNotificationsList>[0];

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

function rowAt(id: string, createdAt: string, extra = {}) {
  return {
    id,
    kind: "shift_confirmed",
    createdAt,
    readAt: null,
    payload: {},
    ...extra,
  };
}

function fullPage() {
  return Array.from({ length: 50 }, (_, at) =>
    rowAt(`row-${at}`, "2026-10-03T01:00:00.000Z"),
  );
}

beforeEach(() => {
  getNotificationsMock.mockReset();
  getNotificationsMock.mockResolvedValue([]);
});

function mounted(over: Partial<Input> = {}) {
  const { wrapper } = createWrapper();

  return renderHook(
    () =>
      useNotificationsList({
        now: FIXED_NOW,
        onPressRow: jest.fn(),
        onUnreadNotices: jest.fn(),
        ...over,
      }),
    { wrapper },
  );
}

describe("useNotificationsList — 조각이 쪽을 이어 붙여 날짜로 묶는다", () => {
  it("받은 알림이 없으면 상태가 empty다", async () => {
    const { result } = mounted();

    await waitFor(() => expect(result.current.state).toBe("empty"));

    expect(result.current.groups).toEqual([]);
  });

  it("같은 날은 한 묶음이고 날마다 머리글이 선다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("a", "2026-10-03T01:00:00.000Z"),
      rowAt("b", "2026-10-03T02:00:00.000Z"),
      rowAt("c", "2026-10-01T02:00:00.000Z"),
    ]);

    const { result } = mounted();

    await waitFor(() => expect(result.current.groups).toHaveLength(2));

    expect(result.current.groups[0].rows.map((row) => row.id)).toEqual([
      "a",
      "b",
    ]);
    expect(result.current.groups[0].header).toBe(
      `머리 ${result.current.groups[0].date}`,
    );
    expect(result.current.groups[1].rows.map((row) => row.id)).toEqual(["c"]);
  });

  it("줄마다 제목과 시각과 안 읽음을 든다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("a", "2026-10-03T01:00:00.000Z"),
      rowAt("b", "2026-10-03T02:00:00.000Z", {
        readAt: "2026-10-03T03:00:00.000Z",
      }),
    ]);

    const { result } = mounted();

    await waitFor(() => expect(result.current.groups).toHaveLength(1));

    const [first, second] = result.current.groups[0].rows;

    expect(first.title).toBe("제목 a");
    expect(first.time).toBe("시각 2026-10-03T01:00:00.000Z");
    expect(first.unread).toBe(true);
    expect(second.unread).toBe(false);
  });

  it("문장이 없는 줄은 안 낸다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("a", "2026-10-03T01:00:00.000Z"),
      rowAt("no-title", "2026-10-03T02:00:00.000Z"),
    ]);

    const { result } = mounted();

    await waitFor(() => expect(result.current.groups).toHaveLength(1));

    expect(result.current.groups[0].rows.map((row) => row.id)).toEqual(["a"]);
  });

  it("갈 곳이 없는 줄은 손이 없다 — 안 눌린다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("no-door", "2026-10-03T01:00:00.000Z"),
    ]);

    const { result } = mounted();

    await waitFor(() => expect(result.current.groups).toHaveLength(1));

    expect(result.current.groups[0].rows[0].press).toBeUndefined();
  });

  it("줄을 누르면 그 줄과 갈 곳을 건넨다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("a", "2026-10-03T01:00:00.000Z"),
    ]);

    const onPressRow = jest.fn();
    const { result } = mounted({ onPressRow });

    await waitFor(() => expect(result.current.groups).toHaveLength(1));

    act(() => result.current.groups[0].rows[0].press?.());

    expect(onPressRow).toHaveBeenCalledWith({
      ids: ["a"],
      destination: "/to/a",
    });
  });

  it("안 읽은 관리자 공지를 받은 쪽에 알린다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("notice", "2026-10-03T01:00:00.000Z", { kind: "admin_notice" }),
      rowAt("a", "2026-10-03T02:00:00.000Z"),
    ]);

    const onUnreadNotices = jest.fn();
    mounted({ onUnreadNotices });

    await waitFor(() =>
      expect(onUnreadNotices).toHaveBeenCalledWith(["notice"]),
    );
  });

  it("안 읽은 공지가 없으면 알리지 않는다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("a", "2026-10-03T01:00:00.000Z"),
    ]);

    const onUnreadNotices = jest.fn();
    const { result } = mounted({ onUnreadNotices });

    await waitFor(() => expect(result.current.state).toBe("end"));

    expect(onUnreadNotices).not.toHaveBeenCalled();
  });

  it("바닥에 안 닿았으면 다음 쪽을 안 부른다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("a", "2026-10-03T01:00:00.000Z"),
    ]);

    const { result } = mounted();

    await waitFor(() => expect(result.current.groups).toHaveLength(1));

    act(() => result.current.loadNextWhenNear(false));

    expect(getNotificationsMock).toHaveBeenCalledTimes(1);
  });

  it("다음 쪽이 없으면 바닥에 닿아도 안 부른다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("a", "2026-10-03T01:00:00.000Z"),
    ]);

    const { result } = mounted();

    await waitFor(() => expect(result.current.state).toBe("end"));

    act(() => result.current.loadNextWhenNear(true));

    expect(getNotificationsMock).toHaveBeenCalledTimes(1);
  });

  it("쪽이 가득 찼고 바닥에 닿으면 다음 쪽을 부른다", async () => {
    getNotificationsMock.mockResolvedValue(fullPage());

    const { result } = mounted();

    await waitFor(() => expect(result.current.state).toBe("normal"));

    act(() => result.current.loadNextWhenNear(true));

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(2));
  });

  it("읽기가 넘어지면 상태가 error고 다시 시도가 다시 읽는다", async () => {
    getNotificationsMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = mounted();

    await waitFor(() => expect(result.current.state).toBe("error"));

    getNotificationsMock.mockResolvedValue([]);

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.state).toBe("empty"));
  });
});

describe("useNotificationsList — 몸통과 스크롤 판정을 조각이 든다", () => {
  function scrollTo(offsetY: number) {
    return {
      nativeEvent: {
        contentOffset: { y: offsetY },
        contentSize: { height: 2000 },
        layoutMeasurement: { height: 800 },
      },
    } as never;
  }

  it("읽는 중이면 몸통이 loading이다", () => {
    const { result } = mounted();

    expect(result.current.body).toBe("loading");
  });

  it("넘어지면 몸통이 failed다", async () => {
    getNotificationsMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = mounted();

    await waitFor(() => expect(result.current.body).toBe("failed"));
  });

  it("받은 것이 없으면 몸통이 empty다", async () => {
    const { result } = mounted();

    await waitFor(() => expect(result.current.body).toBe("empty"));
  });

  it("쪽이 더 남은 줄 목록은 몸통이 rows다", async () => {
    getNotificationsMock.mockResolvedValue(fullPage());

    const { result } = mounted();

    await waitFor(() => expect(result.current.state).toBe("normal"));

    expect(result.current.body).toBe("rows");
  });

  it("끝까지 읽은 줄 목록도 몸통이 rows다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("a", "2026-10-03T01:00:00.000Z"),
    ]);

    const { result } = mounted();

    await waitFor(() => expect(result.current.state).toBe("end"));

    expect(result.current.body).toBe("rows");
  });

  it("바닥에서 멀면 스크롤이 다음 쪽을 안 부른다", async () => {
    getNotificationsMock.mockResolvedValue(fullPage());

    const { result } = mounted();

    await waitFor(() => expect(result.current.state).toBe("normal"));

    act(() => result.current.loadNextOnScroll(scrollTo(0)));

    expect(getNotificationsMock).toHaveBeenCalledTimes(1);
  });

  it("바닥에 닿은 스크롤이 다음 쪽을 부른다", async () => {
    getNotificationsMock.mockResolvedValue(fullPage());

    const { result } = mounted();

    await waitFor(() => expect(result.current.state).toBe("normal"));

    act(() => result.current.loadNextOnScroll(scrollTo(1200)));

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(2));
  });
});
