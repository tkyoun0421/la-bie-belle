import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/scheduleAssign/hooks/useAddAssignmentMutation.ts
//
// 배정 추가 — 정규와 교육 둘 다 이 훅 하나로 간다. `addAssignment(client, { profileId, kind,
// slotId?, dayId?, position?, skipQualification? })`(design.md 「배정과 강제 변경」)의 인자
// 꼴 그대로 훅이 넘긴다 — 정규는 slotId, 교육은 dayId·position이고 화면이 갈래를 이미
// 정해 보낸다. 캐시 갱신은 `['schedule']` `['payroll']` `['requests']`다.

const addAssignmentMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/features/scheduleAssign/api/addAssignment.api",
  () => ({
    addAssignment: addAssignmentMock,
  }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { useAddAssignmentMutation } =
  await import("@/features/scheduleAssign/hooks/useAddAssignmentMutation");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function wrapper({ children }: { children: ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  }

  return { wrapper, queryClient };
}

const FAKE_CLIENT = {} as never;

const PROFILE_ID = "profile-1";
const SLOT_ID = "slot-1";
const DAY_ID = "day-1";

beforeEach(() => {
  addAssignmentMock.mockReset();
});

describe("useAddAssignmentMutation — add_assignment을 부르고 schedule·payroll·requests를 무효화한다", () => {
  it("정규 배정 입력(slotId)을 그대로 DAL에 넘긴다", async () => {
    addAssignmentMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useAddAssignmentMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        profileId: PROFILE_ID,
        kind: "regular",
        slotId: SLOT_ID,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(addAssignmentMock).toHaveBeenCalledWith(FAKE_CLIENT, {
      profileId: PROFILE_ID,
      kind: "regular",
      slotId: SLOT_ID,
    });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["schedule"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["payroll"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["requests"] }),
    );
  });

  it("교육 배정 입력(dayId·position)을 그대로 DAL에 넘긴다 — slotId를 안 보낸다", async () => {
    addAssignmentMock.mockResolvedValue(undefined);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAddAssignmentMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        profileId: PROFILE_ID,
        kind: "training",
        dayId: DAY_ID,
        position: "스캔",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(addAssignmentMock).toHaveBeenCalledWith(FAKE_CLIENT, {
      profileId: PROFILE_ID,
      kind: "training",
      dayId: DAY_ID,
      position: "스캔",
    });
  });

  it("「이번만 넣기」는 skipQualification: true를 그대로 넘긴다", async () => {
    addAssignmentMock.mockResolvedValue(undefined);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAddAssignmentMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        profileId: PROFILE_ID,
        kind: "regular",
        slotId: SLOT_ID,
        skipQualification: true,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(addAssignmentMock).toHaveBeenCalledWith(
      FAKE_CLIENT,
      expect.objectContaining({ skipQualification: true }),
    );
  });

  it("신청 안 한 사람이면 DomainError('not_applied')를 그대로 error에 낸다", async () => {
    addAssignmentMock.mockRejectedValue(new DomainError("not_applied"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAddAssignmentMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        profileId: PROFILE_ID,
        kind: "regular",
        slotId: SLOT_ID,
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("not_applied");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    addAssignmentMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAddAssignmentMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        profileId: PROFILE_ID,
        kind: "regular",
        slotId: SLOT_ID,
      });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({
        profileId: "profile-2",
        kind: "regular",
        slotId: SLOT_ID,
      });
    });

    expect(addAssignmentMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
