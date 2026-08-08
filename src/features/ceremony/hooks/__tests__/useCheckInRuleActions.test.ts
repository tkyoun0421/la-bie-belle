import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE, ERROR_CODES } from "@/shared/config/error-codes.config";

const showSnackbar = vi.fn();
vi.mock("@/shared/ui/snackbar", () => ({ showSnackbar }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("useCheckInRuleActions", () => {
  it("create가 성공하면 onCreate를 호출하고 토스트를 띄우지 않는다", async () => {
    const { useCheckInRuleActions } =
      await import("@/features/ceremony/hooks/useCheckInRuleActions");
    const onCreate = vi.fn().mockResolvedValue({ ok: true });
    const onUpdate = vi.fn();
    const onDelete = vi.fn();

    const { result } = renderHook(() => useCheckInRuleActions(onCreate, onUpdate, onDelete));

    await act(async () => {
      result.current.create({ firstCeremonyAt: "12:00", recommendedCheckIn: "10:10" });
    });

    expect(onCreate).toHaveBeenCalledWith({
      firstCeremonyAt: "12:00",
      recommendedCheckIn: "10:10",
    });
    expect(showSnackbar).not.toHaveBeenCalled();
  });

  it("create가 실패하면 에러 토스트를 띄운다", async () => {
    const { useCheckInRuleActions } =
      await import("@/features/ceremony/hooks/useCheckInRuleActions");
    const onCreate = vi
      .fn()
      .mockResolvedValue({ ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION });
    const onUpdate = vi.fn();
    const onDelete = vi.fn();

    const { result } = renderHook(() => useCheckInRuleActions(onCreate, onUpdate, onDelete));

    await act(async () => {
      result.current.create({ firstCeremonyAt: "12:00", recommendedCheckIn: "10:10" });
    });

    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith(ERROR_CODES.SCHEDULING_VALIDATION.message),
    );
  });

  it("update가 실패하면 에러 토스트를 띄운다", async () => {
    const { useCheckInRuleActions } =
      await import("@/features/ceremony/hooks/useCheckInRuleActions");
    const onCreate = vi.fn();
    const onUpdate = vi.fn().mockResolvedValue({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
    const onDelete = vi.fn();

    const { result } = renderHook(() => useCheckInRuleActions(onCreate, onUpdate, onDelete));

    await act(async () => {
      result.current.update({ firstCeremonyAt: "10:00", recommendedCheckIn: "08:30" });
    });

    expect(onUpdate).toHaveBeenCalledWith({
      firstCeremonyAt: "10:00",
      recommendedCheckIn: "08:30",
    });
    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith(ERROR_CODES.IDENTITY_NOT_ACTIVE.message),
    );
  });

  it("remove가 성공하면 onDelete를 호출한다", async () => {
    const { useCheckInRuleActions } =
      await import("@/features/ceremony/hooks/useCheckInRuleActions");
    const onCreate = vi.fn();
    const onUpdate = vi.fn();
    const onDelete = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useCheckInRuleActions(onCreate, onUpdate, onDelete));

    await act(async () => {
      result.current.remove({ firstCeremonyAt: "10:00" });
    });

    expect(onDelete).toHaveBeenCalledWith({ firstCeremonyAt: "10:00" });
    expect(showSnackbar).not.toHaveBeenCalled();
  });
});
