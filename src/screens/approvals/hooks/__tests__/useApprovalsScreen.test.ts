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
const { APPROVALS_COPY } =
  await import("@/screens/approvals/consts/approvals.const");
const { useApprovalsScreen } =
  await import("@/screens/approvals/hooks/useApprovalsScreen");
const { ADMIN_HOME_PATH } = await import("@/shared/consts/navigation.const");

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

const ONE = {
  id: "one",
  assignmentId: "assign-one",
  reason: "이준호의 사정",
  createdAt: "2026-10-01T03:00:00.000Z",
  dayId: "day-one",
  position: "메인",
  workDate: "2026-10-05",
  startsAt: "18:00:00",
  endsAt: "23:00:00",
  name: "이준호",
  photoUrl: null,
};

beforeEach(() => {
  backMock.mockClear();
  replaceMock.mockClear();
  canGoBackMock.mockReset();
  canGoBackMock.mockReturnValue(true);
});

function mounted() {
  const { wrapper } = createWrapper();

  return renderHook(() => useApprovalsScreen(), { wrapper });
}

describe("useApprovalsScreen — 시트 고르는 자리와 갈 데를 든다", () => {
  it("줄을 누르면 그 요청이 시트에 실린다", () => {
    const { result } = mounted();

    expect(result.current.sheet).toBeNull();

    act(() => result.current.openApproval(ONE));

    expect(result.current.sheet?.id).toBe("one");
    expect(result.current.sheet?.reason).toBe("이준호의 사정");
  });

  it("거절이 끝나면 그 줄을 답한 것으로 적고 토스트가 선다", () => {
    const { result } = mounted();

    act(() => result.current.openApproval(ONE));
    act(() => result.current.finishReject());

    expect(result.current.toast).toBe(APPROVALS_COPY.rejected);
    expect(result.current.sheet).toBeNull();
    expect(result.current.answered).toBe("one");
    expect(replaceMock).not.toHaveBeenCalled();

    act(() => result.current.dismissToast());

    expect(result.current.toast).toBeNull();
  });

  it("승인이 끝나면 그 자리를 채우는 날로 간다", () => {
    const { result } = mounted();

    act(() => result.current.openApproval(ONE));
    act(() => result.current.finishApprove());

    expect(replaceMock).toHaveBeenCalledWith(
      "/admin/schedule?date=2026-10-05&from=approvals",
    );
    expect(result.current.sheet).toBeNull();
    expect(result.current.answered).toBe("one");
    expect(result.current.toast).toBeNull();
  });

  it("아무도 안 눌렀으면 답할 것이 없다", () => {
    const { result } = mounted();

    act(() => result.current.finishReject());
    act(() => result.current.finishApprove());

    expect(result.current.answered).toBeNull();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("시트를 닫으면 상세가 걷힌다", () => {
    const { result } = mounted();

    act(() => result.current.openApproval(ONE));
    act(() => result.current.closeSheet());

    expect(result.current.sheet).toBeNull();
  });

  it("뒤로는 쌓인 것이 있으면 되돌아가고 없으면 관리자 홈으로 간다", () => {
    const { result } = mounted();

    act(() => result.current.goBack());

    expect(backMock).toHaveBeenCalledTimes(1);

    canGoBackMock.mockReturnValue(false);

    act(() => result.current.goBack());

    expect(replaceMock).toHaveBeenCalledWith(ADMIN_HOME_PATH);
  });
});
