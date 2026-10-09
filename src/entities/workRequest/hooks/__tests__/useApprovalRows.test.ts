import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getPendingApprovalsMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule(
  "@/entities/workRequest/api/getPendingApprovals.api",
  () => ({ getPendingApprovals: getPendingApprovalsMock }),
);

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useApprovalRows } =
  await import("@/entities/workRequest/hooks/useApprovalRows");

type Input = Parameters<typeof useApprovalRows>[0];

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

function approval(id: string, workDate: string, name: string) {
  return {
    id,
    assignmentId: `assign-${id}`,
    reason: `${name}의 사정`,
    createdAt: "2026-10-01T03:00:00.000Z",
    dayId: `day-${id}`,
    position: "메인",
    workDate,
    startsAt: "18:00:00",
    endsAt: "23:00:00",
    name,
    photoUrl: null,
  };
}

beforeEach(() => {
  getPendingApprovalsMock.mockReset();
  getPendingApprovalsMock.mockResolvedValue([]);
});

async function mounted(over: Partial<Input> = {}) {
  const { wrapper } = createWrapper();
  const hook = renderHook(
    () => useApprovalRows({ answered: null, onPress: jest.fn(), ...over }),
    { wrapper },
  );

  await waitFor(() => expect(hook.result.current.state).not.toBe("pending"));

  return hook;
}

describe("useApprovalRows — 조각이 판정할 취소 요청을 부른다", () => {
  it("읽기 전에는 pending이다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useApprovalRows({ answered: null, onPress: jest.fn() }),
      { wrapper },
    );

    expect(result.current.state).toBe("pending");
  });

  it("올 것이 없으면 empty다", async () => {
    const { result } = await mounted();

    expect(result.current.state).toBe("empty");
    expect(result.current.rows).toEqual([]);
  });

  it("못 읽으면 failed다", async () => {
    getPendingApprovalsMock.mockRejectedValue(new Error("끊겼어요"));

    const { result } = await mounted();

    expect(result.current.state).toBe("failed");
  });

  it("근무 날이 가까운 것부터 선다", async () => {
    getPendingApprovalsMock.mockResolvedValue([
      approval("late", "2026-10-20", "박수진"),
      approval("soon", "2026-10-05", "이준호"),
    ]);

    const { result } = await mounted();

    expect(result.current.state).toBe("rows");
    expect(result.current.rows.map((row) => row.id)).toEqual(["soon", "late"]);
    expect(result.current.rows[0].title).toContain("이준호");
    expect(result.current.rows[0].detail).toBe("이준호의 사정");
  });

  it("답한 것은 목록에서 빠진다", async () => {
    getPendingApprovalsMock.mockResolvedValue([
      approval("one", "2026-10-05", "이준호"),
    ]);

    const { result } = await mounted({ answered: "one" });

    expect(result.current.rows).toEqual([]);
    expect(result.current.state).toBe("empty");
  });

  it("누르면 그 요청을 건넨다", async () => {
    getPendingApprovalsMock.mockResolvedValue([
      approval("one", "2026-10-05", "이준호"),
    ]);

    const onPress = jest.fn();
    const { result } = await mounted({ onPress });

    result.current.rows[0].press();

    expect(onPress).toHaveBeenCalledWith(
      expect.objectContaining({ id: "one", reason: "이준호의 사정" }),
    );
  });
});
