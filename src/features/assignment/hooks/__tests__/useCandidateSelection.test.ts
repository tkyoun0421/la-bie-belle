import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AssignmentCandidate } from "@/entities/assignment/types/candidate";
import { ERROR_CODE, ERROR_CODES } from "@/shared/config/error-codes.config";

const showSnackbar = vi.fn();
vi.mock("@/shared/ui/snackbar", () => ({ showSnackbar }));

afterEach(() => {
  vi.clearAllMocks();
});

function candidate(overrides: Partial<AssignmentCandidate>): AssignmentCandidate {
  return {
    profileId: "profile-1",
    name: "김근무",
    applied: true,
    currentlyAssigned: false,
    otherPositionNames: [],
    eligible: true,
    ineligibleReason: null,
    ...overrides,
  };
}

const OPEN_PARAMS = {
  scheduleId: "schedule-1",
  positionId: "position-1",
  positionName: "팀장",
  requiredCount: 1,
  assignedCount: 0,
};

describe("useCandidateSelection", () => {
  it("초기 상태는 target·candidates가 null이다", async () => {
    const { useCandidateSelection } =
      await import("@/features/assignment/hooks/useCandidateSelection");
    const onList = vi.fn();
    const onReplace = vi.fn();

    const { result } = renderHook(() => useCandidateSelection({ onList, onReplace }));

    expect(result.current.target).toBeNull();
    expect(result.current.candidates).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.failed).toBe(false);
  });

  it("open은 후보를 불러오고 currentlyAssigned인 후보를 초기 선택으로 세팅한다", async () => {
    const { useCandidateSelection } =
      await import("@/features/assignment/hooks/useCandidateSelection");
    const onList = vi.fn().mockResolvedValue({
      ok: true,
      candidates: [
        candidate({ profileId: "p1", currentlyAssigned: true }),
        candidate({ profileId: "p2", currentlyAssigned: false }),
      ],
    });
    const onReplace = vi.fn();

    const { result } = renderHook(() => useCandidateSelection({ onList, onReplace }));

    act(() => {
      result.current.open(OPEN_PARAMS);
    });

    expect(result.current.loading).toBe(true);
    expect(onList).toHaveBeenCalledWith({ scheduleId: "schedule-1", positionId: "position-1" });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.target).toEqual({
      scheduleId: "schedule-1",
      positionId: "position-1",
      positionName: "팀장",
      requiredCount: 1,
    });
    expect(result.current.assignedCount).toBe(0);
    expect(result.current.selected).toEqual(new Set(["p1"]));
    expect(result.current.changeCount).toBe(0);
  });

  it("후보 조회 실패는 failed를 true로 남긴다", async () => {
    const { useCandidateSelection } =
      await import("@/features/assignment/hooks/useCandidateSelection");
    const onList = vi.fn().mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
    const onReplace = vi.fn();

    const { result } = renderHook(() => useCandidateSelection({ onList, onReplace }));

    await act(async () => {
      result.current.open(OPEN_PARAMS);
    });

    expect(result.current.failed).toBe(true);
    expect(result.current.candidates).toBeNull();
  });

  it("toggle은 선택을 바꾸고 되돌리기 메모리를 지운다", async () => {
    const { useCandidateSelection } =
      await import("@/features/assignment/hooks/useCandidateSelection");
    const onList = vi.fn().mockResolvedValue({
      ok: true,
      candidates: [candidate({ profileId: "p1", currentlyAssigned: false })],
    });
    const onReplace = vi.fn();

    const { result } = renderHook(() => useCandidateSelection({ onList, onReplace }));

    await act(async () => {
      result.current.open(OPEN_PARAMS);
    });
    act(() => {
      result.current.toggle("p1");
    });

    expect(result.current.selected).toEqual(new Set(["p1"]));
    expect(result.current.changeCount).toBe(1);
  });

  it("save 성공 시 배정 수를 갱신하고 되돌리기 메모리를 남긴다", async () => {
    const { useCandidateSelection } =
      await import("@/features/assignment/hooks/useCandidateSelection");
    const onList = vi.fn().mockResolvedValue({
      ok: true,
      candidates: [candidate({ profileId: "p1", currentlyAssigned: false })],
    });
    const onReplace = vi.fn().mockResolvedValue({ ok: true, assignedCount: 1 });

    const { result } = renderHook(() => useCandidateSelection({ onList, onReplace }));

    await act(async () => {
      result.current.open(OPEN_PARAMS);
    });
    act(() => {
      result.current.toggle("p1");
    });
    await act(async () => {
      result.current.save();
    });

    expect(onReplace).toHaveBeenCalledWith({
      scheduleId: "schedule-1",
      positionId: "position-1",
      profileIds: ["p1"],
    });
    expect(result.current.assignedCount).toBe(1);
    expect(result.current.changeCount).toBe(0);
    expect(result.current.undo?.count).toBe(1);
    expect(typeof result.current.undo?.execute).toBe("function");
  });

  it("save 실패 시 선택을 보존하고 스낵바로 오류를 알린다", async () => {
    const { useCandidateSelection } =
      await import("@/features/assignment/hooks/useCandidateSelection");
    const onList = vi.fn().mockResolvedValue({
      ok: true,
      candidates: [candidate({ profileId: "p1", currentlyAssigned: false })],
    });
    const onReplace = vi
      .fn()
      .mockResolvedValue({ ok: false, code: ERROR_CODE.SCHEDULING_ASSIGNMENT_NOT_ELIGIBLE });

    const { result } = renderHook(() => useCandidateSelection({ onList, onReplace }));

    await act(async () => {
      result.current.open(OPEN_PARAMS);
    });
    act(() => {
      result.current.toggle("p1");
    });
    await act(async () => {
      result.current.save();
    });

    expect(result.current.selected).toEqual(new Set(["p1"]));
    expect(result.current.undo).toBeNull();
    expect(showSnackbar).toHaveBeenCalledWith(
      ERROR_CODES.SCHEDULING_ASSIGNMENT_NOT_ELIGIBLE.message,
    );
  });

  it("changeCount가 0이면 save를 호출해도 onReplace가 실행되지 않는다", async () => {
    const { useCandidateSelection } =
      await import("@/features/assignment/hooks/useCandidateSelection");
    const onList = vi.fn().mockResolvedValue({
      ok: true,
      candidates: [candidate({ profileId: "p1", currentlyAssigned: false })],
    });
    const onReplace = vi.fn();

    const { result } = renderHook(() => useCandidateSelection({ onList, onReplace }));

    await act(async () => {
      result.current.open(OPEN_PARAMS);
    });
    await act(async () => {
      result.current.save();
    });

    expect(onReplace).not.toHaveBeenCalled();
  });

  it("되돌리기를 실행하면 저장 이전 선택으로 되돌아간다", async () => {
    const { useCandidateSelection } =
      await import("@/features/assignment/hooks/useCandidateSelection");
    const onList = vi.fn().mockResolvedValue({
      ok: true,
      candidates: [candidate({ profileId: "p1", currentlyAssigned: false })],
    });
    const onReplace = vi.fn().mockResolvedValue({ ok: true, assignedCount: 1 });

    const { result } = renderHook(() => useCandidateSelection({ onList, onReplace }));

    await act(async () => {
      result.current.open(OPEN_PARAMS);
    });
    act(() => {
      result.current.toggle("p1");
    });
    await act(async () => {
      result.current.save();
    });

    onReplace.mockResolvedValue({ ok: true, assignedCount: 0 });
    await act(async () => {
      result.current.undo?.execute();
    });

    expect(onReplace).toHaveBeenLastCalledWith({
      scheduleId: "schedule-1",
      positionId: "position-1",
      profileIds: [],
    });
    expect(result.current.selected).toEqual(new Set());
    expect(result.current.assignedCount).toBe(0);
  });

  it("close는 진행 중이던 요청 결과를 무시하고 상태를 초기화한다", async () => {
    const { useCandidateSelection } =
      await import("@/features/assignment/hooks/useCandidateSelection");
    let resolvePending: (value: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      resolvePending = resolve;
    });
    const onList = vi.fn().mockReturnValue(pending);
    const onReplace = vi.fn();

    const { result } = renderHook(() => useCandidateSelection({ onList, onReplace }));

    act(() => {
      result.current.open(OPEN_PARAMS);
    });
    act(() => {
      result.current.close();
    });

    expect(result.current.target).toBeNull();
    expect(result.current.loading).toBe(false);

    await act(async () => {
      resolvePending({ ok: true, candidates: [] });
    });

    expect(result.current.target).toBeNull();
    expect(result.current.candidates).toBeNull();
  });
});
