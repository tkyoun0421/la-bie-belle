import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE, ERROR_CODES } from "@/shared/config/error-codes.config";

const showSnackbar = vi.fn();
vi.mock("@/shared/ui/snackbar", () => ({ showSnackbar }));

const INPUT = { dates: ["2099-09-01", "2099-09-02"], applicationDeadline: "2099-09-01" };

afterEach(() => {
  vi.clearAllMocks();
});

describe("useOpenRecruitment", () => {
  it("초기 상태는 pending이 false이고 conflictDates가 비어 있다", async () => {
    const { useOpenRecruitment } = await import("@/features/recruitment/hooks/useOpenRecruitment");
    const onOpen = vi.fn().mockResolvedValue({ ok: true, createdCount: 2 });
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useOpenRecruitment(onOpen, onSuccess));

    expect(result.current.pending).toBe(false);
    expect(result.current.conflictDates).toEqual([]);
  });

  it("성공하면 생성 건수 스낵바를 띄우고 onSuccess를 호출한다", async () => {
    const { useOpenRecruitment } = await import("@/features/recruitment/hooks/useOpenRecruitment");
    const onOpen = vi.fn().mockResolvedValue({ ok: true, createdCount: 2 });
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useOpenRecruitment(onOpen, onSuccess));

    await act(async () => {
      result.current.submit(INPUT);
    });

    expect(onOpen).toHaveBeenCalledWith(INPUT);
    expect(showSnackbar).toHaveBeenCalledWith("모집 2건을 열었어요");
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("충돌하면 conflictDates를 채우고 충돌 코드 문구로 스낵바를 띄운다", async () => {
    const { useOpenRecruitment } = await import("@/features/recruitment/hooks/useOpenRecruitment");
    const onOpen = vi.fn().mockResolvedValue({
      ok: false,
      code: ERROR_CODE.SCHEDULING_DATE_CONFLICT,
      conflictDates: ["2099-09-02"],
    });
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useOpenRecruitment(onOpen, onSuccess));

    await act(async () => {
      result.current.submit(INPUT);
    });

    await waitFor(() => expect(result.current.conflictDates).toEqual(["2099-09-02"]));
    expect(showSnackbar).toHaveBeenCalledWith(ERROR_CODES.SCHEDULING_DATE_CONFLICT.message);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("충돌이 아닌 실패는 레지스트리 문구로 스낵바를 띄우고 conflictDates는 비운다", async () => {
    const { useOpenRecruitment } = await import("@/features/recruitment/hooks/useOpenRecruitment");
    const onOpen = vi.fn().mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useOpenRecruitment(onOpen, onSuccess));

    await act(async () => {
      result.current.submit(INPUT);
    });

    expect(showSnackbar).toHaveBeenCalledWith(ERROR_CODES.COMMON_FORBIDDEN.message);
    expect(result.current.conflictDates).toEqual([]);
  });

  it("재제출 시 이전 conflictDates를 초기화한 뒤 새 결과로 채운다", async () => {
    const { useOpenRecruitment } = await import("@/features/recruitment/hooks/useOpenRecruitment");
    const onOpen = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        code: ERROR_CODE.SCHEDULING_DATE_CONFLICT,
        conflictDates: ["2099-09-02"],
      })
      .mockResolvedValueOnce({ ok: true, createdCount: 1 });
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useOpenRecruitment(onOpen, onSuccess));

    await act(async () => {
      result.current.submit(INPUT);
    });
    await waitFor(() => expect(result.current.conflictDates).toEqual(["2099-09-02"]));

    await act(async () => {
      result.current.submit(INPUT);
    });
    await waitFor(() => expect(result.current.conflictDates).toEqual([]));
  });
});
