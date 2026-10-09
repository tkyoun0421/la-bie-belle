import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getMyRehearsalsMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/entities/rehearsal/api/getMyRehearsals.api",
  () => ({
    getMyRehearsals: getMyRehearsalsMock,
  }),
);

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useRehearsalMonthsQuery } =
  await import("@/entities/rehearsal/services/useRehearsalMonthsQuery");

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

const FAKE_CLIENT = {} as never;

function rowFor(month: string) {
  return {
    id: `row-${month}`,
    profileId: "profile-1",
    workDate: `${month}-10`,
    startsAt: "14:00",
    endsAt: "16:00",
    count: null,
  };
}

beforeEach(() => {
  getMyRehearsalsMock.mockReset();
});

describe("useRehearsalMonthsQuery — 요청한 달 수만큼 쿼리가 열린다", () => {
  it("연이면 열두 달을 각각 한 번씩 읽는다", async () => {
    getMyRehearsalsMock.mockImplementation(async (_client, month) => [
      rowFor(month as string),
    ]);
    const months = Array.from(
      { length: 12 },
      (_, index) => `2026-${String(index + 1).padStart(2, "0")}`,
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useRehearsalMonthsQuery(FAKE_CLIENT, months),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const calledMonths = getMyRehearsalsMock.mock.calls.map((call) => call[1]);
    expect(new Set(calledMonths)).toEqual(new Set(months));
    expect(getMyRehearsalsMock).toHaveBeenCalledTimes(12);
  });
});

describe("useRehearsalMonthsQuery — 하나라도 pending이면 로딩이다", () => {
  it("한 달은 응답하고 한 달은 안 끝나면 isLoading이 true다", async () => {
    getMyRehearsalsMock.mockImplementation(async (_client, month) => {
      if (month === "2026-09") {
        return [rowFor(month as string)];
      }
      return new Promise(() => {});
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useRehearsalMonthsQuery(FAKE_CLIENT, ["2026-09", "2026-10"]),
      { wrapper },
    );

    await waitFor(() => expect(getMyRehearsalsMock).toHaveBeenCalledTimes(2));

    expect(result.current.isLoading).toBe(true);
  });
});

describe("useRehearsalMonthsQuery — 하나라도 error면 그 error가 표면에 뜬다", () => {
  it("한 달이 실패하면 error에 그 이유가 담긴다", async () => {
    const failure = new Error("month read failed");
    getMyRehearsalsMock.mockImplementation(async (_client, month) => {
      if (month === "2026-10") {
        throw failure;
      }
      return [rowFor(month as string)];
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useRehearsalMonthsQuery(FAKE_CLIENT, ["2026-09", "2026-10"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error?.message).toBe("month read failed");
  });
});

describe("useRehearsalMonthsQuery — 전부 오면 달치가 합쳐져 나온다", () => {
  it("두 달의 리허설이 하나의 배열로 이어진다", async () => {
    getMyRehearsalsMock.mockImplementation(async (_client, month) => [
      rowFor(month as string),
    ]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useRehearsalMonthsQuery(FAKE_CLIENT, ["2026-09", "2026-10"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.map((row) => row.id)).toEqual(
      expect.arrayContaining(["row-2026-09", "row-2026-10"]),
    );
  });
});
