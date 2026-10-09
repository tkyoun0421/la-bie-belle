import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const listPendingMembersMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

const NOW = "2026-10-03T05:00:00.000Z";

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule("@/entities/member/api/listMembers.api", () => ({
  listActiveMembers: jest.fn(),
  listBlockedMembers: jest.fn(),
  listLeftMembers: jest.fn(),
  listPendingMembers: listPendingMembersMock,
}));

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { usePendingRows } =
  await import("@/entities/member/hooks/usePendingRows");

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

const PENDING = [
  {
    id: "p1",
    displayName: "이준호",
    photoUrl: null,
    submittedAt: "2026-10-01T05:00:00.000Z",
  },
  {
    id: "p2",
    displayName: "박수진",
    photoUrl: null,
    submittedAt: null,
  },
];

beforeEach(() => {
  listPendingMembersMock.mockReset();
  listPendingMembersMock.mockResolvedValue(PENDING);
});

async function mounted(onPress = jest.fn()) {
  const { wrapper } = createWrapper();
  const hook = renderHook(() => usePendingRows({ now: NOW, onPress }), {
    wrapper,
  });

  await waitFor(() => expect(hook.result.current.state).not.toBe("pending"));

  return hook;
}

describe("usePendingRows — 조각이 기다리는 사람을 부른다", () => {
  it("읽기 전에는 pending이다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => usePendingRows({ now: NOW, onPress: jest.fn() }),
      { wrapper },
    );

    expect(result.current.state).toBe("pending");
  });

  it("기다리는 사람이 없으면 empty다", async () => {
    listPendingMembersMock.mockResolvedValue([]);

    const { result } = await mounted();

    expect(result.current.state).toBe("empty");
  });

  it("못 읽으면 failed다", async () => {
    listPendingMembersMock.mockRejectedValue(new Error("끊겼어요"));

    const { result } = await mounted();

    expect(result.current.state).toBe("failed");
  });

  it("줄이 언제 보냈는지를 말하고 안 보낸 사람은 빈 줄이다", async () => {
    const { result } = await mounted();

    expect(result.current.state).toBe("rows");
    expect(result.current.rows).toHaveLength(2);
    expect(result.current.rows[0].detail).toContain("보냈어요");
    expect(result.current.rows[1].detail).toBe("");
  });

  it("누르면 그 사람을 건넨다", async () => {
    const onPress = jest.fn();
    const { result } = await mounted(onPress);

    result.current.rows[0].press();

    expect(onPress).toHaveBeenCalledWith(expect.objectContaining({ id: "p1" }));
  });
});
