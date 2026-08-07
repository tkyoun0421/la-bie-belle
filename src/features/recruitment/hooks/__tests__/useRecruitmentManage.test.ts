import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE, ERROR_CODES } from "@/shared/config/error-codes.config";

const showSnackbar = vi.fn();
vi.mock("@/shared/ui/snackbar", () => ({ showSnackbar }));

const OPEN_SCHEDULE = {
  id: "13000000-0000-4000-8000-000000000001",
  workDate: "2099-09-10",
  applicationDeadline: "2099-09-01",
  status: "OPEN" as const,
};

const CLOSED_SCHEDULE = {
  id: "13000000-0000-4000-8000-000000000002",
  workDate: "2099-09-20",
  applicationDeadline: "2099-09-15",
  status: "CLOSED" as const,
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("useRecruitmentManage", () => {
  it("초기 상태는 managed가 null이고 deadline이 비어 있다", async () => {
    const { useRecruitmentManage } =
      await import("@/features/recruitment/hooks/useRecruitmentManage");
    const onExtend = vi.fn();
    const onReopen = vi.fn();

    const { result } = renderHook(() => useRecruitmentManage(onExtend, onReopen));

    expect(result.current.managed).toBeNull();
    expect(result.current.deadline).toBe("");
    expect(result.current.pending).toBe(false);
    expect(result.current.statusConflict).toBe(false);
  });

  it("open을 호출하면 managed와 현재 마감일이 채워진다", async () => {
    const { useRecruitmentManage } =
      await import("@/features/recruitment/hooks/useRecruitmentManage");
    const onExtend = vi.fn();
    const onReopen = vi.fn();

    const { result } = renderHook(() => useRecruitmentManage(onExtend, onReopen));

    act(() => {
      result.current.open(OPEN_SCHEDULE);
    });

    expect(result.current.managed).toEqual(OPEN_SCHEDULE);
    expect(result.current.deadline).toBe("2099-09-01");
  });

  it("close를 호출하면 시트 상태가 초기화된다", async () => {
    const { useRecruitmentManage } =
      await import("@/features/recruitment/hooks/useRecruitmentManage");
    const onExtend = vi.fn();
    const onReopen = vi.fn();

    const { result } = renderHook(() => useRecruitmentManage(onExtend, onReopen));

    act(() => {
      result.current.open(OPEN_SCHEDULE);
    });
    act(() => {
      result.current.close();
    });

    expect(result.current.managed).toBeNull();
    expect(result.current.deadline).toBe("");
  });

  it("OPEN 스케줄 제출은 onExtend를 호출하고 성공하면 연장 스낵바를 띄운 뒤 시트를 닫는다", async () => {
    const { useRecruitmentManage } =
      await import("@/features/recruitment/hooks/useRecruitmentManage");
    const onExtend = vi.fn().mockResolvedValue({ ok: true });
    const onReopen = vi.fn();

    const { result } = renderHook(() => useRecruitmentManage(onExtend, onReopen));

    act(() => {
      result.current.open(OPEN_SCHEDULE);
    });
    act(() => {
      result.current.setDeadline("2099-09-05");
    });
    await act(async () => {
      result.current.submit();
    });

    expect(onExtend).toHaveBeenCalledWith({
      scheduleId: OPEN_SCHEDULE.id,
      newDeadline: "2099-09-05",
    });
    expect(onReopen).not.toHaveBeenCalled();
    expect(showSnackbar).toHaveBeenCalledWith("마감일을 연장했어요");
    expect(result.current.managed).toBeNull();
  });

  it("CLOSED 스케줄 제출은 onReopen을 호출하고 성공하면 재오픈 스낵바를 띄운 뒤 시트를 닫는다", async () => {
    const { useRecruitmentManage } =
      await import("@/features/recruitment/hooks/useRecruitmentManage");
    const onExtend = vi.fn();
    const onReopen = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useRecruitmentManage(onExtend, onReopen));

    act(() => {
      result.current.open(CLOSED_SCHEDULE);
    });
    act(() => {
      result.current.setDeadline("2099-09-18");
    });
    await act(async () => {
      result.current.submit();
    });

    expect(onReopen).toHaveBeenCalledWith({
      scheduleId: CLOSED_SCHEDULE.id,
      newDeadline: "2099-09-18",
    });
    expect(onExtend).not.toHaveBeenCalled();
    expect(showSnackbar).toHaveBeenCalledWith("모집을 다시 열었어요");
    expect(result.current.managed).toBeNull();
  });

  it("상태 충돌 실패는 statusConflict를 채우고 시트를 유지한다", async () => {
    const { useRecruitmentManage } =
      await import("@/features/recruitment/hooks/useRecruitmentManage");
    const onExtend = vi
      .fn()
      .mockResolvedValue({ ok: false, code: ERROR_CODE.SCHEDULING_STATUS_CONFLICT });
    const onReopen = vi.fn();

    const { result } = renderHook(() => useRecruitmentManage(onExtend, onReopen));

    act(() => {
      result.current.open(OPEN_SCHEDULE);
    });
    await act(async () => {
      result.current.submit();
    });

    await waitFor(() => expect(result.current.statusConflict).toBe(true));
    expect(showSnackbar).toHaveBeenCalledWith(ERROR_CODES.SCHEDULING_STATUS_CONFLICT.message);
    expect(result.current.managed).not.toBeNull();
  });

  it("상태 충돌이 아닌 실패는 레지스트리 문구로 스낵바를 띄우고 시트를 유지한다", async () => {
    const { useRecruitmentManage } =
      await import("@/features/recruitment/hooks/useRecruitmentManage");
    const onExtend = vi.fn().mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    const onReopen = vi.fn();

    const { result } = renderHook(() => useRecruitmentManage(onExtend, onReopen));

    act(() => {
      result.current.open(OPEN_SCHEDULE);
    });
    await act(async () => {
      result.current.submit();
    });

    expect(showSnackbar).toHaveBeenCalledWith(ERROR_CODES.COMMON_FORBIDDEN.message);
    expect(result.current.statusConflict).toBe(false);
    expect(result.current.managed).not.toBeNull();
  });

  it("managed가 없으면 submit은 아무 것도 호출하지 않는다", async () => {
    const { useRecruitmentManage } =
      await import("@/features/recruitment/hooks/useRecruitmentManage");
    const onExtend = vi.fn();
    const onReopen = vi.fn();

    const { result } = renderHook(() => useRecruitmentManage(onExtend, onReopen));

    await act(async () => {
      result.current.submit();
    });

    expect(onExtend).not.toHaveBeenCalled();
    expect(onReopen).not.toHaveBeenCalled();
  });
});
