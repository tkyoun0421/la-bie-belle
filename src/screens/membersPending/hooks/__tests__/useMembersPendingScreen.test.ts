import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getProfilePrivateMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

const backMock = jest.fn();
const replaceMock = jest.fn();
const pushMock = jest.fn();
const canGoBackMock = jest.fn<() => boolean>();

jest.unstable_mockModule("expo-router", () => ({
  useRouter: () => ({
    back: backMock,
    replace: replaceMock,
    push: pushMock,
    canGoBack: canGoBackMock,
  }),
}));

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule("@/entities/profile/api/profilePrivate.api", () => ({
  getProfilePrivate: getProfilePrivateMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { ADMIN_HOME_PATH, ADMIN_MEMBERS_BLOCKED_PATH } =
  await import("@/shared/consts/navigation.const");
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

const WAITING = {
  id: "p1",
  displayName: "이준호",
  photoUrl: null,
  submittedAt: "2026-10-01T05:00:00.000Z",
  approvedAt: null,
  rejectedAt: null,
  blockedAt: null,
};

const VALUES = {
  email: "someone@example.com",
  phone: "010-0000-0001",
  birthDate: "1998-03-04",
  gender: "male",
};

beforeEach(() => {
  getProfilePrivateMock.mockReset();
  getProfilePrivateMock.mockResolvedValue(VALUES);
});

function mounted() {
  const { wrapper } = createWrapper();

  return renderHook(() => useMembersPendingScreen(), { wrapper });
}

describe("useMembersPendingScreen — 시트 고르는 자리와 더보기를 든다", () => {
  it("줄을 누르면 시트가 열리고 개인정보를 읽는다", async () => {
    const { result } = mounted();

    act(() => result.current.openMember(WAITING));

    expect(result.current.sheet?.name).toBe("이준호");
    expect(result.current.sheet?.profileId).toBe("p1");

    await waitFor(() => expect(result.current.sheet?.values).toEqual(VALUES));

    expect(getProfilePrivateMock).toHaveBeenCalledWith(FAKE_CLIENT, "p1");
  });

  it("시트가 닫혀 있으면 개인정보를 안 읽는다", () => {
    mounted();

    expect(getProfilePrivateMock).not.toHaveBeenCalled();
  });

  it("시트를 닫으면 걷힌다", () => {
    const { result } = mounted();

    act(() => result.current.openMember(WAITING));
    act(() => result.current.closeSheet());

    expect(result.current.sheet).toBeNull();
  });

  it("끝났다고 받으면 토스트가 서고 시트가 닫힌다", () => {
    const { result } = mounted();

    act(() => result.current.openMember(WAITING));
    act(() =>
      result.current.finish({
        kind: "success",
        message: "이준호 님을 승인했어요",
      }),
    );

    expect(result.current.toast?.message).toBe("이준호 님을 승인했어요");
    expect(result.current.sheet).toBeNull();

    act(() => result.current.dismissToast());

    expect(result.current.toast).toBeNull();
  });
});

describe("useMembersPendingScreen — 갈 데를 controller가 정한다", () => {
  beforeEach(() => {
    backMock.mockClear();
    replaceMock.mockClear();
    pushMock.mockClear();
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

  it("차단한 사람으로 가면 더보기가 닫힌다", () => {
    const { result } = mounted();

    act(() => result.current.toggleMenu());
    expect(result.current.menuOpen).toBe(true);

    act(() => result.current.openBlocked());

    expect(pushMock).toHaveBeenCalledWith(ADMIN_MEMBERS_BLOCKED_PATH);
    expect(result.current.menuOpen).toBe(false);
  });

  it("줄을 누르면 더보기가 닫히고 시트가 열린다", () => {
    const { result } = mounted();

    act(() => result.current.toggleMenu());

    act(() => result.current.openMember(WAITING));

    expect(result.current.menuOpen).toBe(false);
    expect(result.current.sheet).not.toBeNull();
  });
});
