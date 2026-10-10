import { jest } from "@jest/globals";
import type { ReactNode } from "react";

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
const { MEMBER_DECISION_COPY } =
  await import("@/entities/member/consts/member.const");
const { BLOCKED_COPY } =
  await import("@/screens/membersPending/consts/membersPending.const");
const { ADMIN_MEMBERS_PENDING_PATH } =
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

const BLOCKED = {
  id: "p1",
  displayName: "최민재",
  photoUrl: null,
  submittedAt: null,
  approvedAt: null,
  rejectedAt: null,
  blockedAt: "2026-10-01T05:00:00.000Z",
};

beforeEach(() => {
  unblockMemberMock.mockReset();
  unblockMemberMock.mockResolvedValue(undefined);
});

function mounted() {
  const { wrapper } = createWrapper();

  return renderHook(() => useMembersBlockedScreen(), { wrapper });
}

describe("useMembersBlockedScreen — 줄에서 바로 묻는다", () => {
  it("줄에서 누르면 그 사람 이름으로 묻는다", () => {
    const { result } = mounted();

    act(() => result.current.openMember(BLOCKED));

    expect(result.current.confirming?.question).toBe(
      `최민재${BLOCKED_COPY.confirmSuffix}`,
    );
  });

  it("풀면 그 사람 id로 가고 토스트가 선다", async () => {
    const { result } = mounted();

    act(() => result.current.openMember(BLOCKED));
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

    const { result } = mounted();

    act(() => result.current.openMember(BLOCKED));
    act(() => result.current.unblock());

    await waitFor(() =>
      expect(result.current.toast?.message).toBe(
        MEMBER_DECISION_COPY.alreadyDecided,
      ),
    );

    expect(result.current.confirming).toBeNull();
  });

  it("통신이 끊기면 시트를 연 채로 둔다", async () => {
    unblockMemberMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = mounted();

    act(() => result.current.openMember(BLOCKED));
    act(() => result.current.unblock());

    await waitFor(() => expect(result.current.failed).toBe(true));

    expect(result.current.confirming).not.toBeNull();
    expect(result.current.toast).toBeNull();
  });

  it("아무도 안 눌렀으면 풀 것이 없다", () => {
    const { result } = mounted();

    act(() => result.current.unblock());

    expect(unblockMemberMock).not.toHaveBeenCalled();
  });

  it("닫으면 물음이 사라지고 토스트도 치울 수 있다", async () => {
    const { result } = mounted();

    act(() => result.current.openMember(BLOCKED));
    act(() => result.current.close());

    expect(result.current.confirming).toBeNull();

    act(() => result.current.openMember(BLOCKED));
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

  it("돌아갈 데가 있으면 뒤로 간다", () => {
    canGoBackMock.mockReturnValue(true);
    const { result } = mounted();

    act(() => result.current.goBack());

    expect(backMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("돌아갈 데가 없으면 가입 대기로 바꿔 넣는다", () => {
    canGoBackMock.mockReturnValue(false);
    const { result } = mounted();

    act(() => result.current.goBack());

    expect(replaceMock).toHaveBeenCalledWith(ADMIN_MEMBERS_PENDING_PATH);
    expect(backMock).not.toHaveBeenCalled();
  });
});

describe("useMembersBlockedScreen — 실패 문안을 controller가 완성해 내려준다", () => {
  it("통신이 끊기면 failedLine이 그 슬라이스의 문안과 같다", async () => {
    unblockMemberMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = mounted();

    act(() => result.current.openMember(BLOCKED));
    act(() => result.current.unblock());

    await waitFor(() => {
      expect(result.current.failedLine).toBe(BLOCKED_COPY.sendFailed);
    });
  });

  it("failedLine이 빈 글자가 아니다", async () => {
    unblockMemberMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = mounted();

    act(() => result.current.openMember(BLOCKED));
    act(() => result.current.unblock());

    await waitFor(() => expect(result.current.failed).toBe(true));

    expect(result.current.failedLine).toBeTruthy();
  });
});
