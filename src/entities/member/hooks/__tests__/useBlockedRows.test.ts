import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const listBlockedMembersMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

const NOW = "2026-10-03T05:00:00.000Z";

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule("@/entities/member/api/listMembers.api", () => ({
  listActiveMembers: jest.fn(),
  listBlockedMembers: listBlockedMembersMock,
  listLeftMembers: jest.fn(),
  listPendingMembers: jest.fn(),
}));

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useBlockedRows } =
  await import("@/entities/member/hooks/useBlockedRows");

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

const BLOCKED = [
  {
    id: "p9",
    displayName: "한지우",
    photoUrl: null,
    blockedAt: "2026-10-01T05:00:00.000Z",
  },
  {
    id: "p10",
    displayName: "최민재",
    photoUrl: null,
    blockedAt: null,
  },
];

beforeEach(() => {
  listBlockedMembersMock.mockReset();
  listBlockedMembersMock.mockResolvedValue(BLOCKED);
});

async function mounted(onPress = jest.fn()) {
  const { wrapper } = createWrapper();
  const hook = renderHook(() => useBlockedRows({ now: NOW, onPress }), {
    wrapper,
  });

  await waitFor(() => expect(hook.result.current.state).not.toBe("pending"));

  return hook;
}

describe("useBlockedRows — 조각이 차단한 사람을 부른다", () => {
  it("읽기 전에는 pending이다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useBlockedRows({ now: NOW, onPress: jest.fn() }),
      { wrapper },
    );

    expect(result.current.state).toBe("pending");
  });

  it("차단한 사람이 없으면 empty다", async () => {
    listBlockedMembersMock.mockResolvedValue([]);

    const { result } = await mounted();

    expect(result.current.state).toBe("empty");
  });

  it("못 읽으면 failed다", async () => {
    listBlockedMembersMock.mockRejectedValue(new Error("끊겼어요"));

    const { result } = await mounted();

    expect(result.current.state).toBe("failed");
  });

  it("줄이 언제 차단했는지를 말하고 모르면 빈 줄이다", async () => {
    const { result } = await mounted();

    expect(result.current.state).toBe("rows");
    expect(result.current.rows[0].name).toBe("한지우");
    expect(result.current.rows[0].detail).toContain("차단했어요");
    expect(result.current.rows[1].detail).toBe("");
  });

  it("누르면 그 사람을 건넨다", async () => {
    const onPress = jest.fn();
    const { result } = await mounted(onPress);

    result.current.rows[0].press();

    expect(onPress).toHaveBeenCalledWith(expect.objectContaining({ id: "p9" }));
  });
});
