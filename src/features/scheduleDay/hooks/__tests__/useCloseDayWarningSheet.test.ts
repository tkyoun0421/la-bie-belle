import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const closeDayMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/features/scheduleDay/api/closeDay.api", () => ({
  closeDay: closeDayMock,
}));

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useCloseDayWarningSheet } =
  await import("@/features/scheduleDay/hooks/useCloseDayWarningSheet");

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
    () =>
      useCloseDayWarningSheet({
        workDate: "2026-10-10",
        assignmentCount: 3,
        onDone,
      }),
    { wrapper },
  );
}

beforeEach(() => {
  closeDayMock.mockReset();
  closeDayMock.mockResolvedValue(undefined);
});

describe("useCloseDayWarningSheet — 날짜와 배정 수를 문구로 세운다", () => {
  it("닫을 날을 제목으로 묻는다", () => {
    const { result } = mount();

    expect(result.current.title).toBe("10월 10일을 닫을까요?");
  });

  it("같이 사라질 배정 수를 경고 줄로 낸다", () => {
    const { result } = mount();

    expect(result.current.warningLine).toContain("3");
  });
});

describe("useCloseDayWarningSheet — 조각이 자기 mutation을 부른다", () => {
  it("닫으면 그 날이 실려 간다", async () => {
    const { result } = mount();

    expect(result.current.closing).toBe(false);

    act(() => result.current.close());

    await waitFor(() =>
      expect(closeDayMock).toHaveBeenCalledWith(FAKE_CLIENT, "2026-10-10"),
    );
  });

  it("성공하면 끝났다고 알린다", async () => {
    const onDone = jest.fn();
    const { result } = mount(onDone);

    act(() => result.current.close());

    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });
});
