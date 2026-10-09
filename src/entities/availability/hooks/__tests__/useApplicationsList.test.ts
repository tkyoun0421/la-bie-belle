import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getMonthAvailabilitiesMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule(
  "@/entities/availability/api/getMonthAvailabilities.api",
  () => ({ getMonthAvailabilities: getMonthAvailabilitiesMock }),
);

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useApplicationsList } =
  await import("@/entities/availability/hooks/useApplicationsList");

type Input = Parameters<typeof useApplicationsList>[0];

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

const APPLICATIONS = [
  { profileId: "p1", workDate: "2026-10-11", name: "최민재" },
  { profileId: "p2", workDate: "2026-10-10", name: "한지우" },
  { profileId: "p1", workDate: "2026-10-10", name: "최민재" },
];

beforeEach(() => {
  getMonthAvailabilitiesMock.mockReset();
  getMonthAvailabilitiesMock.mockResolvedValue(APPLICATIONS);
});

async function mounted(over: Partial<Input> = {}) {
  const { wrapper } = createWrapper();
  const hook = renderHook(
    () => useApplicationsList({ month: "2026-10", tab: "date", ...over }),
    { wrapper },
  );

  await waitFor(() => expect(hook.result.current.state).not.toBe("pending"));

  return hook;
}

describe("useApplicationsList — 조각이 한 질의를 두 방향으로 접는다", () => {
  it("읽기 전에는 pending이다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useApplicationsList({ month: "2026-10", tab: "date" }),
      { wrapper },
    );

    expect(result.current.state).toBe("pending");
  });

  it("받은 달을 읽는다", async () => {
    await mounted({ month: "2026-11" });

    expect(getMonthAvailabilitiesMock).toHaveBeenCalledWith(
      FAKE_CLIENT,
      "2026-11",
    );
  });

  it("신청이 없으면 empty다", async () => {
    getMonthAvailabilitiesMock.mockResolvedValue([]);

    const { result } = await mounted();

    expect(result.current.state).toBe("empty");
  });

  it("못 읽으면 failed다", async () => {
    getMonthAvailabilitiesMock.mockRejectedValue(new Error("끊겼어요"));

    const { result } = await mounted();

    expect(result.current.state).toBe("failed");
  });

  it("날짜순은 날짜가 이른 쪽부터 선다", async () => {
    const { result } = await mounted();

    expect(result.current.state).toBe("date");
    expect(result.current.dateGroups.map((group) => group.key)).toEqual([
      "2026-10-10",
      "2026-10-11",
    ]);
    expect(result.current.dateGroups[0].heading).toContain("10월 10일");
    expect(result.current.dateGroups[0].names.map((one) => one.name)).toEqual([
      "한지우",
      "최민재",
    ]);
  });

  it("사람순은 그 사람이 일할 수 있는 날이 한 줄이다", async () => {
    const { result } = await mounted({ tab: "person" });

    expect(result.current.state).toBe("person");
    expect(result.current.personGroups[0].displayName).toBe("최민재");
    expect(result.current.personGroups[0].dates).toContain("10월 10일");
    expect(result.current.personGroups[0].dates).toContain("10월 11일");
  });
});
