import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const listPendingMembersMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getProfilePrivateMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const approveMemberMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const rejectMemberMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const blockMemberMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule("@/entities/member/api/listMembers.api", () => ({
  listActiveMembers: jest.fn(),
  listBlockedMembers: jest.fn(),
  listLeftMembers: jest.fn(),
  listPendingMembers: listPendingMembersMock,
}));

jest.unstable_mockModule("@/entities/profile/api/profilePrivate.api", () => ({
  getProfilePrivate: getProfilePrivateMock,
}));

jest.unstable_mockModule(
  "@/features/memberAdmin/api/approveMember.api",
  () => ({ approveMember: approveMemberMock }),
);

jest.unstable_mockModule("@/features/memberAdmin/api/rejectMember.api", () => ({
  rejectMember: rejectMemberMock,
}));

jest.unstable_mockModule("@/features/memberAdmin/api/blockMember.api", () => ({
  blockMember: blockMemberMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { PENDING_COPY } =
  await import("@/screens/membersPending/consts/membersPending.const");
const { useMembersPendingScreen } =
  await import("@/screens/membersPending/hooks/useMembersPendingScreen");

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

const PENDING = [
  {
    id: "p1",
    display_name: "이준호",
    photo_url: null,
    submitted_at: "2026-10-01T05:00:00.000Z",
  },
  {
    id: "p2",
    display_name: "박수진",
    photo_url: null,
    submitted_at: null,
  },
];

const VALUES = {
  email: "someone@example.com",
  phone: "010-0000-0001",
  birth_date: "1998-03-04",
  gender: "male",
};

beforeEach(() => {
  listPendingMembersMock.mockReset();
  getProfilePrivateMock.mockReset();
  approveMemberMock.mockReset();
  rejectMemberMock.mockReset();
  blockMemberMock.mockReset();

  listPendingMembersMock.mockResolvedValue(PENDING);
  getProfilePrivateMock.mockResolvedValue(VALUES);
  approveMemberMock.mockResolvedValue(undefined);
  rejectMemberMock.mockResolvedValue(undefined);
  blockMemberMock.mockResolvedValue(undefined);
});

async function mounted() {
  const { wrapper } = createWrapper();
  const hook = renderHook(() => useMembersPendingScreen(), {
    wrapper,
  });

  await waitFor(() =>
    expect(hook.result.current.listState).not.toBe("loading"),
  );

  return hook;
}

describe("useMembersPendingScreen — 판정 셋이 한 꼴이다", () => {
  it("읽기 전에는 loading이다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMembersPendingScreen(), {
      wrapper,
    });

    expect(result.current.listState).toBe("loading");
  });

  it("기다리는 사람이 없으면 empty다", async () => {
    listPendingMembersMock.mockResolvedValue([]);

    const { result } = await mounted();

    expect(result.current.listState).toBe("empty");
  });

  it("줄이 언제 보냈는지를 말하고 안 보낸 사람은 빈 줄이다", async () => {
    const { result } = await mounted();

    expect(result.current.listState).toBe("rows");
    expect(result.current.rows).toHaveLength(2);
    expect(result.current.rows[0].detail).toContain("보냈어요");
    expect(result.current.rows[1].detail).toBe("");
  });

  it("줄을 누르면 시트가 열리고 개인정보를 읽는다", async () => {
    const { result } = await mounted();

    act(() => result.current.rows[0].press());

    expect(result.current.sheet?.name).toBe("이준호");
    expect(result.current.face).toBe("detail");

    await waitFor(() => expect(result.current.sheet?.values).toEqual(VALUES));

    expect(getProfilePrivateMock).toHaveBeenCalledWith(FAKE_CLIENT, "p1");
  });

  it("시트가 닫혀 있으면 개인정보를 안 읽는다", async () => {
    await mounted();

    expect(getProfilePrivateMock).not.toHaveBeenCalled();
  });

  it("승인하면 그 사람 id로 가고 이름이 든 토스트가 선다", async () => {
    const { result } = await mounted();

    act(() => result.current.rows[0].press());
    act(() => result.current.approve());

    await waitFor(() =>
      expect(approveMemberMock).toHaveBeenCalledWith(FAKE_CLIENT, "p1"),
    );

    await waitFor(() =>
      expect(result.current.toast?.message).toBe(
        `이준호${PENDING_COPY.approvedSuffix}`,
      ),
    );

    expect(result.current.sheet).toBeNull();
  });

  it("거절은 얼굴을 바꿔 묻고 확인하면 보낸다", async () => {
    const { result } = await mounted();

    act(() => result.current.rows[0].press());
    act(() => result.current.showFace("reject"));

    expect(result.current.face).toBe("reject");

    act(() => result.current.confirm());

    await waitFor(() =>
      expect(rejectMemberMock).toHaveBeenCalledWith(FAKE_CLIENT, "p1"),
    );

    await waitFor(() =>
      expect(result.current.toast?.message).toBe(
        `이준호${PENDING_COPY.rejectedSuffix}`,
      ),
    );
  });

  it("차단도 같은 꼴이다", async () => {
    const { result } = await mounted();

    act(() => result.current.rows[0].press());
    act(() => result.current.showFace("block"));
    act(() => result.current.confirm());

    await waitFor(() =>
      expect(blockMemberMock).toHaveBeenCalledWith(FAKE_CLIENT, "p1"),
    );

    await waitFor(() =>
      expect(result.current.toast?.message).toBe(
        `이준호${PENDING_COPY.blockedSuffix}`,
      ),
    );
  });

  it("상세 얼굴에서 확인을 눌러도 아무것도 안 보낸다", async () => {
    const { result } = await mounted();

    act(() => result.current.rows[0].press());
    act(() => result.current.confirm());

    expect(rejectMemberMock).not.toHaveBeenCalled();
    expect(blockMemberMock).not.toHaveBeenCalled();
  });

  it("늦게 누르면 시트를 닫고 안내 토스트를 세운다", async () => {
    approveMemberMock.mockRejectedValue(new DomainError("already_decided"));

    const { result } = await mounted();

    act(() => result.current.rows[0].press());
    act(() => result.current.approve());

    await waitFor(() =>
      expect(result.current.toast?.message).toBe(PENDING_COPY.alreadyDecided),
    );

    expect(result.current.sheet).toBeNull();
  });

  it("통신이 끊기면 시트를 연 채로 둔다", async () => {
    approveMemberMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted();

    act(() => result.current.rows[0].press());
    act(() => result.current.approve());

    await waitFor(() => expect(result.current.failed).toBe(true));

    expect(result.current.sheet?.name).toBe("이준호");
    expect(result.current.toast).toBeNull();
  });

  it("시트를 닫으면 얼굴이 처음으로 돌아간다", async () => {
    const { result } = await mounted();

    act(() => result.current.rows[0].press());
    act(() => result.current.showFace("block"));
    act(() => result.current.closeSheet());

    expect(result.current.sheet).toBeNull();
    expect(result.current.face).toBe("detail");
  });

  it("토스트를 치우면 사라진다", async () => {
    const { result } = await mounted();

    act(() => result.current.rows[0].press());
    act(() => result.current.approve());

    await waitFor(() => expect(result.current.toast).not.toBeNull());

    act(() => result.current.dismissToast());

    expect(result.current.toast).toBeNull();
  });
});
