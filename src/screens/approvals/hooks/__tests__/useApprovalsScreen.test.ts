import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getPendingApprovalsMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

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
  "@/entities/workRequest/api/getPendingApprovals.api",
  () => ({ getPendingApprovals: getPendingApprovalsMock }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
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

function approval(id: string, workDate: string, name: string) {
  return {
    id,
    assignmentId: `assign-${id}`,
    reason: `${name}의 사정`,
    createdAt: "2026-10-01T03:00:00.000Z",
    dayId: `day-${id}`,
    position: "메인",
    workDate,
    startsAt: "18:00:00",
    endsAt: "23:00:00",
    name,
    photoUrl: null,
  };
}

beforeEach(() => {
  getPendingApprovalsMock.mockReset();
  backMock.mockClear();
  replaceMock.mockClear();
  canGoBackMock.mockReset();
  canGoBackMock.mockReturnValue(true);

  getPendingApprovalsMock.mockResolvedValue([]);
});

async function mounted() {
  const { wrapper } = createWrapper();
  const hook = renderHook(() => useApprovalsScreen(), {
    wrapper,
  });

  await waitFor(() =>
    expect(hook.result.current.listState).not.toBe("loading"),
  );

  return hook;
}

describe("useApprovalsScreen — 목록과 시트 고르는 자리를 든다", () => {
  it("읽기 전에는 loading이다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useApprovalsScreen(), {
      wrapper,
    });

    expect(result.current.listState).toBe("loading");
  });

  it("올 것이 없으면 empty다", async () => {
    const { result } = await mounted();

    expect(result.current.listState).toBe("empty");
    expect(result.current.rows).toEqual([]);
  });

  it("근무 날이 가까운 것부터 선다", async () => {
    getPendingApprovalsMock.mockResolvedValue([
      approval("late", "2026-10-20", "박수진"),
      approval("soon", "2026-10-05", "이준호"),
    ]);

    const { result } = await mounted();

    expect(result.current.listState).toBe("rows");
    expect(result.current.rows.map((row) => row.id)).toEqual(["soon", "late"]);
    expect(result.current.rows[0].title).toContain("이준호");
    expect(result.current.rows[0].detail).toBe("이준호의 사정");
  });

  it("줄을 누르면 그 요청이 시트에 실린다", async () => {
    getPendingApprovalsMock.mockResolvedValue([
      approval("one", "2026-10-05", "이준호"),
    ]);

    const { result } = await mounted();

    expect(result.current.sheet).toBeNull();

    act(() => result.current.rows[0].press());

    expect(result.current.sheet?.id).toBe("one");
    expect(result.current.sheet?.reason).toBe("이준호의 사정");
  });

  it("거절이 끝나면 그 줄이 빠지고 토스트가 선다", async () => {
    getPendingApprovalsMock.mockResolvedValue([
      approval("one", "2026-10-05", "이준호"),
    ]);

    const { result } = await mounted();

    act(() => result.current.rows[0].press());
    act(() => result.current.finishReject());

    expect(result.current.toast).toBe(APPROVALS_COPY.rejected);
    expect(result.current.sheet).toBeNull();
    expect(result.current.listState).toBe("empty");
    expect(replaceMock).not.toHaveBeenCalled();

    act(() => result.current.dismissToast());

    expect(result.current.toast).toBeNull();
  });

  it("승인이 끝나면 그 자리를 채우는 날로 간다", async () => {
    getPendingApprovalsMock.mockResolvedValue([
      approval("one", "2026-10-05", "이준호"),
    ]);

    const { result } = await mounted();

    act(() => result.current.rows[0].press());
    act(() => result.current.finishApprove());

    expect(replaceMock).toHaveBeenCalledWith(
      "/admin/schedule?date=2026-10-05&from=approvals",
    );
    expect(result.current.sheet).toBeNull();
    expect(result.current.listState).toBe("empty");
    expect(result.current.toast).toBeNull();
  });

  it("시트를 닫으면 상세가 걷힌다", async () => {
    getPendingApprovalsMock.mockResolvedValue([
      approval("one", "2026-10-05", "이준호"),
    ]);

    const { result } = await mounted();

    act(() => result.current.rows[0].press());
    act(() => result.current.closeSheet());

    expect(result.current.sheet).toBeNull();
  });

  it("뒤로는 쌓인 것이 있으면 되돌아가고 없으면 관리자 홈으로 간다", async () => {
    const { result } = await mounted();

    act(() => result.current.goBack());

    expect(backMock).toHaveBeenCalledTimes(1);

    canGoBackMock.mockReturnValue(false);

    act(() => result.current.goBack());

    expect(replaceMock).toHaveBeenCalledWith(ADMIN_HOME_PATH);
  });
});
