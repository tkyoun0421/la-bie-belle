import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/screens/members/hooks/useMembersScreen.ts
//
// 관리자가 이미 받은 사람들을 다루는 화면의 controller다. `.tsx`가 `useState` 일곱과
// `useEffect` 다섯을 들고, 오류 코드 비교와 알림 갈래 표 조립과 퇴사 구획 접기까지 하고
// 있었다.
//
// **쓰기 넷이 한 시트에서 나간다.** 이름·역할·퇴사·되돌리기가 같은 사람을 보고, 성공하면
// 넷 다 시트를 닫고 토스트를 세운다 — 말만 다르다.
//
// **막는 자리 둘은 서버가 정한다.** 화면이 미리 잠그는 것은 목록을 받은 시점의 판정이고,
// 누르는 시점의 판정은 `last_admin`과 `has_future_assignments`로 돌아와 Dialog가 말한다.

const listActiveMembersMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const listLeftMembersMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const setDisplayNameMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const setRoleMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const markLeaveMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const undoLeaveMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/member/api/listMembers.api", () => ({
  listActiveMembers: listActiveMembersMock,
  listBlockedMembers: jest.fn(),
  listLeftMembers: listLeftMembersMock,
  listPendingMembers: jest.fn(),
}));

jest.unstable_mockModule(
  "@/features/memberAdmin/api/setDisplayName.api",
  () => ({ setDisplayName: setDisplayNameMock }),
);

jest.unstable_mockModule("@/features/memberAdmin/api/setRole.api", () => ({
  setRole: setRoleMock,
}));

jest.unstable_mockModule("@/features/memberAdmin/api/markLeave.api", () => ({
  markLeave: markLeaveMock,
}));

jest.unstable_mockModule("@/features/memberAdmin/api/undoLeave.api", () => ({
  undoLeave: undoLeaveMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { MEMBERS_COPY } = await import("@/screens/members/consts/members.const");
const { useMembersScreen } =
  await import("@/screens/members/hooks/useMembersScreen");

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

const FAKE_CLIENT = {} as never;

function member(over: Record<string, unknown>) {
  return {
    id: "p1",
    display_name: "이준호",
    photo_url: null,
    role: "member",
    left_at: null,
    blocked_at: null,
    erased_at: null,
    phone: "010-0000-0001",
    birth_date: "1998-03-04",
    gender: "male",
    notifications_enabled: true,
    has_device: true,
    ...over,
  };
}

const ACTIVE = [
  member({ id: "p1", display_name: "이준호" }),
  member({ id: "p2", display_name: "박수진", role: "admin" }),
];

/** 1년이 넘은 퇴사자 하나와 최근 퇴사자 하나다 — 접히는 쪽이 앞의 것이다. */
const LEFT = [
  member({
    id: "p3",
    display_name: "최민서",
    left_at: "2026-09-20T00:00:00.000Z",
    notifications_enabled: false,
    has_device: false,
  }),
  member({
    id: "p4",
    display_name: "강하늘",
    left_at: "2024-01-05T00:00:00.000Z",
    erased_at: "2025-01-05T00:00:00.000Z",
    phone: null,
    notifications_enabled: false,
    has_device: false,
  }),
];

beforeEach(() => {
  listActiveMembersMock.mockReset();
  listLeftMembersMock.mockReset();
  setDisplayNameMock.mockReset();
  setRoleMock.mockReset();
  markLeaveMock.mockReset();
  undoLeaveMock.mockReset();

  listActiveMembersMock.mockResolvedValue(ACTIVE);
  listLeftMembersMock.mockResolvedValue(LEFT);
  setDisplayNameMock.mockResolvedValue(undefined);
  setRoleMock.mockResolvedValue(undefined);
  markLeaveMock.mockResolvedValue(undefined);
  undoLeaveMock.mockResolvedValue(undefined);
});

async function mounted() {
  const { wrapper } = createWrapper();
  const hook = renderHook(() => useMembersScreen(FAKE_CLIENT), { wrapper });

  await waitFor(() =>
    expect(hook.result.current.listState).not.toBe("loading"),
  );

  return hook;
}

describe("useMembersScreen — 쓰기 넷이 한 시트에서 나간다", () => {
  it("읽기 전에는 loading이다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMembersScreen(FAKE_CLIENT), {
      wrapper,
    });

    expect(result.current.listState).toBe("loading");
  });

  it("아무도 없으면 empty다", async () => {
    listActiveMembersMock.mockResolvedValue([]);
    listLeftMembersMock.mockResolvedValue([]);

    const { result } = await mounted();

    expect(result.current.listState).toBe("empty");
  });

  it("재직 줄에 연락처와 관리자 표시가 선다", async () => {
    const { result } = await mounted();

    expect(result.current.listState).toBe("rows");
    expect(result.current.activeRows).toHaveLength(2);
    expect(result.current.activeRows[0].detail).toContain("010-0000-0001");
    expect(result.current.activeRows[1].isAdmin).toBe(true);
  });

  it("1년이 지난 퇴사자는 접히고 더 보기로 펴진다", async () => {
    const { result } = await mounted();

    expect(result.current.leftRows).toHaveLength(1);
    expect(result.current.canExpand).toBe(true);

    act(() => result.current.expand());

    expect(result.current.leftRows).toHaveLength(2);
    expect(result.current.canExpand).toBe(false);
  });

  it("퇴사 줄이 퇴사한 날을 값으로 낸다", async () => {
    const { result } = await mounted();

    expect(result.current.leftRows[0].value).toContain("2026년");
  });

  it("찾으면 두 구획을 같이 거르고 접힌 것도 드러난다", async () => {
    const { result } = await mounted();

    act(() => result.current.search("강하늘"));

    expect(result.current.activeRows).toEqual([]);
    expect(result.current.leftRows).toHaveLength(1);
    expect(result.current.searchEmpty).toBe(false);

    act(() => result.current.search("없는이름"));

    expect(result.current.searchEmpty).toBe(true);
  });

  it("시트를 열면 그 사람과 고칠 이름이 실린다", async () => {
    const { result } = await mounted();

    act(() => result.current.activeRows[0].press());

    expect(result.current.sheet?.name).toBe("이준호");
    expect(result.current.face).toBe("detail");

    act(() => result.current.showFace("rename"));

    expect(result.current.draft).toBe("이준호");
  });

  it("이름을 고쳐 저장하면 그 사람 id로 가고 시트가 닫힌다", async () => {
    const { result } = await mounted();

    act(() => result.current.activeRows[0].press());
    act(() => result.current.showFace("rename"));
    act(() => result.current.writeDraft("이준서"));
    act(() => result.current.saveName());

    await waitFor(() =>
      expect(setDisplayNameMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        "p1",
        "이준서",
      ),
    );

    await waitFor(() =>
      expect(result.current.toast?.message).toBe(MEMBERS_COPY.nameChanged),
    );

    expect(result.current.sheet).toBeNull();
  });

  it("관리자로 올리기는 확인을 받고 역할을 보낸다", async () => {
    const { result } = await mounted();

    act(() => result.current.activeRows[0].press());
    act(() => result.current.askRole());

    expect(result.current.dialog).toBe("promote");

    act(() => result.current.confirm());

    await waitFor(() =>
      expect(setRoleMock).toHaveBeenCalledWith(FAKE_CLIENT, "p1", "admin"),
    );

    await waitFor(() =>
      expect(result.current.toast?.message).toBe(MEMBERS_COPY.promoted),
    );
  });

  it("관리자가 한 명뿐이면 내리기를 미리 잠근다", async () => {
    const { result } = await mounted();

    act(() => result.current.activeRows[1].press());

    expect(result.current.lastAdmin).toBe(true);
  });

  it("퇴사 처리는 확인을 받고 그 사람 id로 간다", async () => {
    const { result } = await mounted();

    act(() => result.current.activeRows[0].press());
    act(() => result.current.askLeave());

    expect(result.current.dialog).toBe("leave");

    act(() => result.current.confirm());

    await waitFor(() =>
      expect(markLeaveMock).toHaveBeenCalledWith(FAKE_CLIENT, "p1"),
    );

    await waitFor(() =>
      expect(result.current.toast?.message).toBe(MEMBERS_COPY.leaveDone),
    );
  });

  it("퇴사 되돌리기도 같은 꼴이다", async () => {
    const { result } = await mounted();

    act(() => result.current.leftRows[0].press());
    act(() => result.current.askUndo());

    expect(result.current.dialog).toBe("undo");

    act(() => result.current.confirm());

    await waitFor(() =>
      expect(undoLeaveMock).toHaveBeenCalledWith(FAKE_CLIENT, "p3"),
    );

    await waitFor(() =>
      expect(result.current.toast?.message).toBe(MEMBERS_COPY.undoDone),
    );
  });

  it("앞으로 배정이 남았다고 거절당하면 그 Dialog가 선다", async () => {
    markLeaveMock.mockRejectedValue(new DomainError("has_future_assignments"));

    const { result } = await mounted();

    act(() => result.current.activeRows[0].press());
    act(() => result.current.askLeave());
    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.dialog).toBe("blocked"));

    expect(result.current.failed).toBe(false);
  });

  it("마지막 관리자라고 거절당하면 그 Dialog가 선다", async () => {
    setRoleMock.mockRejectedValue(new DomainError("last_admin"));

    const { result } = await mounted();

    act(() => result.current.activeRows[0].press());
    act(() => result.current.askRole());
    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.dialog).toBe("last-admin"));
  });

  it("이미 처리된 사람이면 토스트가 서고 시트가 닫힌다", async () => {
    markLeaveMock.mockRejectedValue(new DomainError("already_decided"));

    const { result } = await mounted();

    act(() => result.current.activeRows[0].press());
    act(() => result.current.askLeave());
    act(() => result.current.confirm());

    await waitFor(() =>
      expect(result.current.toast?.message).toBe(MEMBERS_COPY.alreadyDecided),
    );

    expect(result.current.sheet).toBeNull();
  });

  it("통신이 끊긴 것은 시트에 실패를 세운다", async () => {
    setDisplayNameMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted();

    act(() => result.current.activeRows[0].press());
    act(() => result.current.showFace("rename"));
    act(() => result.current.writeDraft("이준서"));
    act(() => result.current.saveName());

    await waitFor(() => expect(result.current.failed).toBe(true));

    expect(result.current.sheet?.name).toBe("이준호");
  });

  it("시트를 닫으면 얼굴과 적은 값이 처음으로 돌아간다", async () => {
    const { result } = await mounted();

    act(() => result.current.activeRows[0].press());
    act(() => result.current.showFace("rename"));
    act(() => result.current.writeDraft("이준서"));
    act(() => result.current.close());

    expect(result.current.sheet).toBeNull();
    expect(result.current.face).toBe("detail");
    expect(result.current.draft).toBe("");
  });

  it("토스트를 치우면 사라진다", async () => {
    const { result } = await mounted();

    act(() => result.current.activeRows[0].press());
    act(() => result.current.askLeave());
    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.toast).not.toBeNull());

    act(() => result.current.dismissToast());

    expect(result.current.toast).toBeNull();
  });
});
