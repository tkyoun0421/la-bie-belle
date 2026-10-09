import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const createScheduleMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule(
  "@/features/scheduleDay/api/createSchedule.api",
  () => ({
    createSchedule: createScheduleMock,
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
const { useCreateScheduleSheet } =
  await import("@/features/scheduleDay/hooks/useCreateScheduleSheet");

const TODAY = "2026-10-05";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
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

function mount(onDone: () => void = jest.fn()) {
  const { wrapper } = createWrapper();

  return renderHook(
    () => useCreateScheduleSheet({ month: "2026-10", today: TODAY, onDone }),
    { wrapper },
  );
}

beforeEach(() => {
  createScheduleMock.mockReset();
  createScheduleMock.mockResolvedValue(undefined);
});

describe("useCreateScheduleSheet — 달 이름이 제목과 안내에 든다", () => {
  it("제목과 안내가 그 달을 부른다", () => {
    const { result } = mount();

    expect(result.current.title).toBe("10월 근무표 만들기");
    expect(result.current.noticeLine).toContain("10월");
  });

  it("보내기 전에는 실패 줄이 없다", () => {
    const { result } = mount();

    expect(result.current.failedLine).toBeNull();
  });
});

describe("useCreateScheduleSheet — 마감일은 오늘부터만 보낼 수 있다", () => {
  it("빈 칸으로는 못 보낸다", () => {
    const { result } = mount();

    expect(result.current.deadline).toBe("");
    expect(result.current.canSave).toBe(false);
  });

  it("오늘 이전을 적으면 못 보낸다", () => {
    const { result } = mount();

    act(() => result.current.writeDeadline("2026-10-01"));

    expect(result.current.deadline).toBe("2026-10-01");
    expect(result.current.canSave).toBe(false);
  });

  it("오늘 이후를 적으면 보낼 수 있다", () => {
    const { result } = mount();

    act(() => result.current.writeDeadline("2026-10-20"));

    expect(result.current.canSave).toBe(true);
  });
});

describe("useCreateScheduleSheet — 조각이 자기 mutation을 부른다", () => {
  it("달과 적은 마감일이 실려 간다", async () => {
    const { result } = mount();

    act(() => result.current.writeDeadline("2026-10-20"));
    act(() => result.current.create());

    await waitFor(() =>
      expect(createScheduleMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        "2026-10",
        "2026-10-20",
      ),
    );
  });

  it("성공하면 끝났다고 알린다", async () => {
    const onDone = jest.fn();
    const { result } = mount(onDone);

    act(() => result.current.writeDeadline("2026-10-20"));
    act(() => result.current.create());

    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });

  it("실패하면 그 줄이 선다", async () => {
    createScheduleMock.mockRejectedValue(new Error("못 만들었다"));

    const { result } = mount();

    act(() => result.current.writeDeadline("2026-10-20"));
    act(() => result.current.create());

    await waitFor(() => expect(result.current.failedLine).not.toBeNull());
  });
});
