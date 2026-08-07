import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

const showSnackbar = vi.fn();
vi.mock("@/shared/ui/snackbar", () => ({ showSnackbar }));

afterEach(() => {
  vi.clearAllMocks();
});

function formDataOf(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
}

describe("useHourlyWageForm", () => {
  it("초기 상태는 pending이 false고 오류가 없다", async () => {
    const { useHourlyWageForm } =
      await import("@/features/worker-management/hooks/useHourlyWageForm");
    const action = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useHourlyWageForm(action));

    expect(result.current.pending).toBe(false);
    expect(result.current.state.ok).toBe(true);
  });

  it("FormData의 hourlyWage를 숫자로 변환해 action에 전달한다", async () => {
    const { useHourlyWageForm } =
      await import("@/features/worker-management/hooks/useHourlyWageForm");
    const action = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useHourlyWageForm(action));

    await act(async () => {
      result.current.formAction(formDataOf({ hourlyWage: "15000" }));
    });

    await waitFor(() => expect(action).toHaveBeenCalledWith(15000));
  });

  it("fieldErrors 없는 실패는 레지스트리 문구로 스낵바를 띄운다", async () => {
    const { useHourlyWageForm } =
      await import("@/features/worker-management/hooks/useHourlyWageForm");
    const action = vi.fn().mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });

    const { result } = renderHook(() => useHourlyWageForm(action));

    await act(async () => {
      result.current.formAction(formDataOf({ hourlyWage: "15000" }));
    });

    await waitFor(() => expect(showSnackbar).toHaveBeenCalledWith("접근 권한이 없어요"));
  });

  it("fieldErrors가 있으면 스낵바를 띄우지 않는다", async () => {
    const { useHourlyWageForm } =
      await import("@/features/worker-management/hooks/useHourlyWageForm");
    const action = vi.fn().mockResolvedValue({
      ok: false,
      code: ERROR_CODE.IDENTITY_VALIDATION,
      fieldErrors: { hourlyWage: "시급을 확인해 주세요" },
    });

    const { result } = renderHook(() => useHourlyWageForm(action));

    await act(async () => {
      result.current.formAction(formDataOf({ hourlyWage: "0" }));
    });

    await waitFor(() => expect(result.current.state.ok).toBe(false));
    expect(showSnackbar).not.toHaveBeenCalled();
  });
});
