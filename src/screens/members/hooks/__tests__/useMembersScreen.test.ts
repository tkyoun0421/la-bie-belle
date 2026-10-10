import { jest } from "@jest/globals";
import type { ReactNode } from "react";

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

const { renderHook, act } = await import("@testing-library/react-native");
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

const ACTIVE = member({ id: "p1", displayName: "이준호" }) as never;

function mounted() {
  const { wrapper } = createWrapper();

  return renderHook(() => useMembersScreen(), { wrapper });
}

describe("useMembersScreen — 시트 고르는 자리와 찾는 말을 든다", () => {
  it("시트를 열면 그 사람과 그 시트가 쓸 값이 실린다", () => {
    const { result } = mounted();

    act(() => result.current.openMember(ACTIVE, false));

    expect(result.current.sheet?.name).toBe("이준호");
    expect(result.current.sheet?.member.id).toBe("p1");
    expect(result.current.reachLine).not.toBeUndefined();
  });

  it("관리자가 한 명뿐이라고 받으면 시트에 그렇다고 알린다", () => {
    const { result } = mounted();

    act(() => result.current.openMember(ACTIVE, true));

    expect(result.current.lastAdmin).toBe(true);
  });

  it("시트를 닫으면 걷힌다", () => {
    const { result } = mounted();

    act(() => result.current.openMember(ACTIVE, false));
    act(() => result.current.close());

    expect(result.current.sheet).toBeNull();
  });

  it("끝났다고 받으면 토스트가 서고 시트가 닫힌다", () => {
    const { result } = mounted();

    act(() => result.current.openMember(ACTIVE, false));
    act(() =>
      result.current.finish({ kind: "success", message: "퇴사 처리했어요" }),
    );

    expect(result.current.toast?.message).toBe("퇴사 처리했어요");
    expect(result.current.toast?.kind).toBe("success");
    expect(result.current.sheet).toBeNull();

    act(() => result.current.dismissToast());

    expect(result.current.toast).toBeNull();
  });

  it("찾는 말과 펼침을 조각에 내려준다", () => {
    const { result } = mounted();

    act(() => result.current.search("강하늘"));

    expect(result.current.query).toBe("강하늘");

    act(() => result.current.expand());

    expect(result.current.expanded).toBe(true);
  });

  it("알림이 꺼진 사람의 꼬리말을 조각에 내려준다", () => {
    const { result } = mounted();

    const note = result.current.noteOf(
      member({ notificationsEnabled: false }) as never,
    );

    expect(note).toBe("· 알림 꺼둠");
  });
});

describe("useMembersScreen — 갈 데를 controller가 정한다", () => {
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

  it("돌아갈 데가 없으면 관리자 홈으로 바꿔 넣는다", () => {
    canGoBackMock.mockReturnValue(false);
    const { result } = mounted();

    act(() => result.current.goBack());

    expect(replaceMock).toHaveBeenCalledWith(ADMIN_HOME_PATH);
    expect(backMock).not.toHaveBeenCalled();
  });
});
