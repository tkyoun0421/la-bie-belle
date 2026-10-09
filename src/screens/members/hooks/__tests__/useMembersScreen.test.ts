import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const listActiveMembersMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const listLeftMembersMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

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
  listActiveMembers: listActiveMembersMock,
  listBlockedMembers: jest.fn(),
  listLeftMembers: listLeftMembersMock,
  listPendingMembers: jest.fn(),
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { ADMIN_HOME_PATH } = await import("@/shared/consts/navigation.const");
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

async function mounted() {
  const { wrapper } = createWrapper();
  const hook = renderHook(() => useMembersScreen(), { wrapper });

  await waitFor(() =>
    expect(hook.result.current.listState).not.toBe("loading"),
  );

  return hook;
}

describe("useMembersScreen — 목록과 시트 고르는 자리를 든다", () => {
  it("읽기 전에는 loading이다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMembersScreen(), {
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

  it("시트를 열면 그 사람과 그 시트가 쓸 값이 실린다", async () => {
    const { result } = await mounted();

    act(() => result.current.activeRows[0].press());

    expect(result.current.sheet?.name).toBe("이준호");
    expect(result.current.sheet?.member.id).toBe("p1");
    expect(result.current.reachLine).not.toBeUndefined();
  });

  it("관리자가 한 명뿐이면 시트에 그렇다고 알린다", async () => {
    const { result } = await mounted();

    act(() => result.current.activeRows[1].press());

    expect(result.current.lastAdmin).toBe(true);
  });

  it("시트를 닫으면 걷힌다", async () => {
    const { result } = await mounted();

    act(() => result.current.activeRows[0].press());
    act(() => result.current.close());

    expect(result.current.sheet).toBeNull();
  });

  it("끝났다고 받으면 토스트가 서고 시트가 닫힌다", async () => {
    const { result } = await mounted();

    act(() => result.current.activeRows[0].press());
    act(() =>
      result.current.finish({ kind: "success", message: "퇴사 처리했어요" }),
    );

    expect(result.current.toast?.message).toBe("퇴사 처리했어요");
    expect(result.current.sheet).toBeNull();

    act(() => result.current.dismissToast());

    expect(result.current.toast).toBeNull();
  });
});

describe("useMembersScreen — 갈 데를 controller가 정한다", () => {
  beforeEach(() => {
    backMock.mockClear();
    replaceMock.mockClear();
    canGoBackMock.mockReset();
    listActiveMembersMock.mockResolvedValue([]);
    listLeftMembersMock.mockResolvedValue([]);
  });

  it("돌아갈 데가 있으면 뒤로 간다", async () => {
    canGoBackMock.mockReturnValue(true);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMembersScreen(), { wrapper });

    act(() => result.current.goBack());

    expect(backMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("돌아갈 데가 없으면 관리자 홈으로 바꿔 넣는다", async () => {
    canGoBackMock.mockReturnValue(false);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMembersScreen(), { wrapper });

    act(() => result.current.goBack());

    expect(replaceMock).toHaveBeenCalledWith(ADMIN_HOME_PATH);
    expect(backMock).not.toHaveBeenCalled();
  });
});
