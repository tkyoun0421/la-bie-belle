import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const listBlockedMembersMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const unblockMemberMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

const backMock = jest.fn();
const replaceMock = jest.fn();
const canGoBackMock = jest.fn<() => boolean>();

jest.unstable_mockModule("expo-router", () => ({
  useRouter: () => ({
    back: backMock,
    replace: replaceMock,
    canGoBack: canGoBackMock,
  }),
}));

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule("@/entities/member/api/listMembers.api", () => ({
  listActiveMembers: jest.fn(),
  listBlockedMembers: listBlockedMembersMock,
  listLeftMembers: jest.fn(),
  listPendingMembers: jest.fn(),
}));

jest.unstable_mockModule(
  "@/features/memberAdmin/api/unblockMember.api",
  () => ({
    unblockMember: unblockMemberMock,
  }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { BLOCKED_COPY, PENDING_COPY } =
  await import("@/screens/membersPending/consts/membersPending.const");
const { MEMBERS_PENDING_PATH } =
  await import("@/shared/consts/navigation.const");
const { useMembersBlockedScreen } =
  await import("@/screens/membersPending/hooks/useMembersBlockedScreen");

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

const BLOCKED = [
  {
    id: "p1",
    displayName: "최민재",
    photoUrl: null,
    blockedAt: "2026-10-01T05:00:00.000Z",
  },
  {
    id: "p2",
    displayName: "한지우",
    photoUrl: null,
    blockedAt: null,
  },
];

beforeEach(() => {
  listBlockedMembersMock.mockReset();
  unblockMemberMock.mockReset();

  listBlockedMembersMock.mockResolvedValue(BLOCKED);
  unblockMemberMock.mockResolvedValue(undefined);
});

async function mounted() {
  const { wrapper } = createWrapper();
  const hook = renderHook(() => useMembersBlockedScreen(), {
    wrapper,
  });

  await waitFor(() =>
    expect(hook.result.current.listState).not.toBe("loading"),
  );

  return hook;
}

describe("useMembersBlockedScreen — 줄에서 바로 묻는다", () => {
  it("읽기 전에는 loading이다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMembersBlockedScreen(), {
      wrapper,
    });

    expect(result.current.listState).toBe("loading");
  });

  it("차단한 사람이 없으면 empty다", async () => {
    listBlockedMembersMock.mockResolvedValue([]);

    const { result } = await mounted();

    expect(result.current.listState).toBe("empty");
  });

  it("줄이 언제 차단했는지를 말한다", async () => {
    const { result } = await mounted();

    expect(result.current.listState).toBe("rows");
    expect(result.current.rows[0].detail).toContain("차단했어요");
    expect(result.current.rows[1].detail).toBe("");
  });

  it("줄에서 누르면 그 사람 이름으로 묻는다", async () => {
    const { result } = await mounted();

    act(() => result.current.rows[0].press());

    expect(result.current.confirming?.question).toBe(
      `최민재${BLOCKED_COPY.confirmSuffix}`,
    );
  });

  it("풀면 그 사람 id로 가고 토스트가 선다", async () => {
    const { result } = await mounted();

    act(() => result.current.rows[0].press());
    act(() => result.current.unblock());

    await waitFor(() =>
      expect(unblockMemberMock).toHaveBeenCalledWith(FAKE_CLIENT, "p1"),
    );

    await waitFor(() =>
      expect(result.current.toast?.message).toBe(
        `최민재${BLOCKED_COPY.unblockedSuffix}`,
      ),
    );

    expect(result.current.confirming).toBeNull();
  });

  it("늦게 누르면 시트를 닫고 안내 토스트를 세운다", async () => {
    unblockMemberMock.mockRejectedValue(new DomainError("already_decided"));

    const { result } = await mounted();

    act(() => result.current.rows[0].press());
    act(() => result.current.unblock());

    await waitFor(() =>
      expect(result.current.toast?.message).toBe(PENDING_COPY.alreadyDecided),
    );

    expect(result.current.confirming).toBeNull();
  });

  it("통신이 끊기면 시트를 연 채로 둔다", async () => {
    unblockMemberMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted();

    act(() => result.current.rows[0].press());
    act(() => result.current.unblock());

    await waitFor(() => expect(result.current.failed).toBe(true));

    expect(result.current.confirming).not.toBeNull();
    expect(result.current.toast).toBeNull();
  });

  it("아무도 안 눌렀으면 풀 것이 없다", async () => {
    const { result } = await mounted();

    act(() => result.current.unblock());

    expect(unblockMemberMock).not.toHaveBeenCalled();
  });

  it("닫으면 물음이 사라지고 토스트도 치울 수 있다", async () => {
    const { result } = await mounted();

    act(() => result.current.rows[0].press());
    act(() => result.current.close());

    expect(result.current.confirming).toBeNull();

    act(() => result.current.rows[0].press());
    act(() => result.current.unblock());

    await waitFor(() => expect(result.current.toast).not.toBeNull());

    act(() => result.current.dismissToast());

    expect(result.current.toast).toBeNull();
  });
});

describe("useMembersBlockedScreen — 갈 데를 controller가 정한다", () => {
  beforeEach(() => {
    backMock.mockClear();
    replaceMock.mockClear();
    canGoBackMock.mockReset();
  });

  it("돌아갈 데가 있으면 뒤로 간다", async () => {
    canGoBackMock.mockReturnValue(true);
    const { result } = await mounted();

    act(() => result.current.goBack());

    expect(backMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("돌아갈 데가 없으면 가입 대기로 바꿔 넣는다", async () => {
    canGoBackMock.mockReturnValue(false);
    const { result } = await mounted();

    act(() => result.current.goBack());

    expect(replaceMock).toHaveBeenCalledWith(MEMBERS_PENDING_PATH);
    expect(backMock).not.toHaveBeenCalled();
  });
});
