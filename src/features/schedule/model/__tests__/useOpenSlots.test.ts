import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/schedule/model/useOpenSlots.ts
//
// 빈 자리를 `open_slots` 뷰로 읽는다 — TS가 다시 세지 않는다(design.md 「계산의 예외
// 하나」). 화면은 `group-open-slots.ts`로 날짜별 수만 묶는다. 캐시 키는 이 문서 어디에도
// 못 박혀 있지 않아 이 테스트가 `useMonthWindow`(['schedule', month, 'window'])와 같은
// 접미사 관례로 `['schedule', month, 'open-slots']`를 고른다 — `['schedule']`
// 무효화가 이 값도 낡게 해야 하므로 SCHEDULE_KEY 아래 둔다.

const getOpenSlotsMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/schedule/dals/getOpenSlots", () => ({
  getOpenSlots: getOpenSlotsMock,
}));

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useOpenSlots } = await import("@/features/schedule/model/useOpenSlots");

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

  return { wrapper, queryClient };
}

const FAKE_CLIENT = {} as never;

const MONTH = "2026-10";

const ROWS = [
  {
    slot_id: "slot-1",
    day_id: "day-1",
    work_date: "2026-10-10",
    positions: ["스캔"],
  },
];

beforeEach(() => {
  getOpenSlotsMock.mockReset();
});

describe("useOpenSlots — getOpenSlots를 그 달로 불러 ['schedule', month, 'open-slots']에 앉힌다", () => {
  it("client와 month를 그대로 넘겨 DAL을 부른다", async () => {
    getOpenSlotsMock.mockResolvedValue(ROWS);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useOpenSlots(FAKE_CLIENT, MONTH), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getOpenSlotsMock).toHaveBeenCalledWith(FAKE_CLIENT, MONTH);
  });

  it("아직 응답이 없으면 isLoading이 참이다", () => {
    getOpenSlotsMock.mockReturnValue(new Promise(() => {}));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useOpenSlots(FAKE_CLIENT, MONTH), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("응답하면 빈 자리 행을 그대로 낸다", async () => {
    getOpenSlotsMock.mockResolvedValue(ROWS);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useOpenSlots(FAKE_CLIENT, MONTH), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(ROWS);
  });

  it("DAL이 실패하면 error를 낸다", async () => {
    getOpenSlotsMock.mockRejectedValue(new Error("통신이 끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useOpenSlots(FAKE_CLIENT, MONTH), {
      wrapper,
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("캐시 키는 ['schedule', month, 'open-slots']다", async () => {
    getOpenSlotsMock.mockResolvedValue(ROWS);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useOpenSlots(FAKE_CLIENT, MONTH), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["schedule", MONTH, "open-slots"])).toEqual(
      ROWS,
    );
  });
});
