import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const listActiveMembersMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const listLeftMembersMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

const NOW = "2026-10-03T05:00:00.000Z";

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule("@/entities/member/api/listMembers.api", () => ({
  listActiveMembers: listActiveMembersMock,
  listBlockedMembers: jest.fn(),
  listLeftMembers: listLeftMembersMock,
  listPendingMembers: jest.fn(),
}));

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useMemberRows } = await import("@/entities/member/hooks/useMemberRows");

type Input = Parameters<typeof useMemberRows>[0];

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

function member(over: Record<string, unknown>) {
  return {
    id: "p1",
    displayName: "이준호",
    photoUrl: null,
    role: "member",
    leftAt: null,
    blockedAt: null,
    erasedAt: null,
    phone: "010-0000-0001",
    birthDate: "1998-03-04",
    gender: "male",
    notificationsEnabled: true,
    hasDevice: true,
    ...over,
  };
}

const ACTIVE = [
  member({ id: "p1", displayName: "이준호" }),
  member({ id: "p2", displayName: "박수진", role: "admin" }),
];

const LEFT = [
  member({
    id: "p3",
    displayName: "최민서",
    leftAt: "2026-09-20T00:00:00.000Z",
    notificationsEnabled: false,
    hasDevice: false,
  }),
  member({
    id: "p4",
    displayName: "강하늘",
    leftAt: "2024-01-05T00:00:00.000Z",
    erasedAt: "2025-01-05T00:00:00.000Z",
    phone: null,
    notificationsEnabled: false,
    hasDevice: false,
  }),
];

beforeEach(() => {
  listActiveMembersMock.mockReset();
  listLeftMembersMock.mockReset();

  listActiveMembersMock.mockResolvedValue(ACTIVE);
  listLeftMembersMock.mockResolvedValue(LEFT);
});

function input(over: Partial<Input> = {}): Input {
  return {
    kind: "active",
    query: "",
    now: NOW,
    expanded: false,
    onPress: jest.fn(),
    ...over,
  };
}

async function mounted(over: Partial<Input> = {}) {
  const { wrapper } = createWrapper();
  const hook = renderHook((props: Input) => useMemberRows(props), {
    wrapper,
    initialProps: input(over),
  });

  await waitFor(() => expect(hook.result.current.state).not.toBe("pending"));

  return hook;
}

describe("useMemberRows — 조각이 자기 사람 목록을 부른다", () => {
  it("읽기 전에는 pending이다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMemberRows(input()), { wrapper });

    expect(result.current.state).toBe("pending");
  });

  it("아무도 없으면 empty고 까닭이 noMembers다", async () => {
    listActiveMembersMock.mockResolvedValue([]);
    listLeftMembersMock.mockResolvedValue([]);

    const { result } = await mounted();

    expect(result.current.state).toBe("empty");

    if (result.current.state !== "empty") {
      throw new Error("empty가 아니다");
    }

    expect(result.current.reason).toBe("noMembers");
  });

  it("못 읽으면 failed다", async () => {
    listActiveMembersMock.mockRejectedValue(new Error("끊겼어요"));

    const { result } = await mounted();

    expect(result.current.state).toBe("failed");
  });

  it("재직 줄에 연락처와 관리자 표시가 선다", async () => {
    const { result } = await mounted();

    expect(result.current.state).toBe("ready");

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.rows).toHaveLength(2);
    expect(result.current.rows[0].detail).toContain("010-0000-0001");
    expect(result.current.rows[1].isAdmin).toBe(true);
  });

  it("받은 꼬리말을 연락처 뒤에 붙인다", async () => {
    const { result } = await mounted({ noteOf: () => "· 알림 꺼둠" });

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.rows[0].detail).toBe("010-0000-0001 · 알림 꺼둠");
  });

  it("1년이 지난 퇴사자는 접히고 펴면 드러난다", async () => {
    const folded = await mounted({ kind: "left" });
    const opened = await mounted({ kind: "left", expanded: true });

    if (folded.result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    if (opened.result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(folded.result.current.rows).toHaveLength(1);
    expect(folded.result.current.canExpand).toBe(true);
    expect(opened.result.current.rows).toHaveLength(2);
    expect(opened.result.current.canExpand).toBe(false);
  });

  it("퇴사 줄이 퇴사한 날을 값으로 낸다", async () => {
    const { result } = await mounted({ kind: "left" });

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.rows[0].value).toContain("2026년");
  });

  it("찾으면 두 구획을 같이 거르고 접힌 것도 드러난다", async () => {
    const left = await mounted({ kind: "left", query: "강하늘" });

    if (left.result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(left.result.current.rows).toHaveLength(1);

    const missed = await mounted({ query: "없는이름" });

    expect(missed.result.current.state).toBe("empty");

    if (missed.result.current.state !== "empty") {
      throw new Error("empty가 아니다");
    }

    expect(missed.result.current.reason).toBe("noMatch");
  });

  it("맞는 이름이 없다는 말은 재직 쪽만 한다", async () => {
    const { result } = await mounted({ kind: "left", query: "없는이름" });

    expect(result.current.state).toBe("empty");

    if (result.current.state !== "empty") {
      throw new Error("empty가 아니다");
    }

    expect(result.current.reason).toBe("noRows");
  });

  it("누르면 그 사람과 마지막 관리자인지를 같이 건넨다", async () => {
    const onPress = jest.fn();
    const { result } = await mounted({ onPress });

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    result.current.rows[1].press();

    expect(onPress).toHaveBeenCalledWith(
      expect.objectContaining({ id: "p2" }),
      true,
    );

    result.current.rows[0].press();

    expect(onPress).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "p1" }),
      false,
    );
  });
});
