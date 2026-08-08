import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Position } from "@/entities/position/model/position";
import { ERROR_CODE, ERROR_CODES } from "@/shared/config/error-codes.config";

const showSnackbar = vi.fn();
vi.mock("@/shared/ui/snackbar", () => ({ showSnackbar }));

afterEach(() => {
  vi.clearAllMocks();
});

const EXISTING_POSITION: Position = {
  id: "position-1",
  name: "매니저",
  code: null,
  defaultRequiredCount: 2,
  genderRequirement: "any",
  isDefault: true,
  isActive: true,
};

describe("usePositionEditor", () => {
  it("openCreate는 빈 폼으로 편집 상태를 연다", async () => {
    const { usePositionEditor } = await import("@/features/position/hooks/usePositionEditor");
    const { result } = renderHook(() => usePositionEditor(vi.fn(), vi.fn(), vi.fn()));

    act(() => {
      result.current.openCreate();
    });

    expect(result.current.editing).toBe("new");
    expect(result.current.form).toEqual({
      name: "",
      defaultRequiredCount: 1,
      genderRequirement: "any",
      isDefault: false,
      isActive: true,
    });
  });

  it("openEdit은 기존 포지션 값으로 폼을 채운다", async () => {
    const { usePositionEditor } = await import("@/features/position/hooks/usePositionEditor");
    const { result } = renderHook(() => usePositionEditor(vi.fn(), vi.fn(), vi.fn()));

    act(() => {
      result.current.openEdit(EXISTING_POSITION);
    });

    expect(result.current.editing).toEqual(EXISTING_POSITION);
    expect(result.current.form).toEqual({
      name: "매니저",
      defaultRequiredCount: 2,
      genderRequirement: "any",
      isDefault: true,
      isActive: true,
    });
  });

  it("새 포지션 저장은 onCreate를 호출하고 성공 시 편집 상태를 닫는다", async () => {
    const onCreate = vi.fn().mockResolvedValue({ ok: true });
    const { usePositionEditor } = await import("@/features/position/hooks/usePositionEditor");
    const { result } = renderHook(() => usePositionEditor(onCreate, vi.fn(), vi.fn()));

    act(() => {
      result.current.openCreate();
      result.current.updateField("name", "신규포지션");
    });

    await act(async () => {
      result.current.save();
    });

    expect(onCreate).toHaveBeenCalledWith({
      name: "신규포지션",
      defaultRequiredCount: 1,
      genderRequirement: "any",
      isDefault: false,
    });
    await waitFor(() => expect(result.current.editing).toBeNull());
  });

  it("기존 포지션 저장은 onUpdate를 id와 함께 호출한다", async () => {
    const onUpdate = vi.fn().mockResolvedValue({ ok: true });
    const { usePositionEditor } = await import("@/features/position/hooks/usePositionEditor");
    const { result } = renderHook(() => usePositionEditor(vi.fn(), onUpdate, vi.fn()));

    act(() => {
      result.current.openEdit(EXISTING_POSITION);
      result.current.updateField("defaultRequiredCount", 3);
    });

    await act(async () => {
      result.current.save();
    });

    expect(onUpdate).toHaveBeenCalledWith({
      id: "position-1",
      name: "매니저",
      defaultRequiredCount: 3,
      genderRequirement: "any",
      isDefault: true,
      isActive: true,
    });
  });

  it("저장 실패는 편집 상태를 유지하고 에러 토스트를 띄운다", async () => {
    const onCreate = vi
      .fn()
      .mockResolvedValue({ ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION });
    const { usePositionEditor } = await import("@/features/position/hooks/usePositionEditor");
    const { result } = renderHook(() => usePositionEditor(onCreate, vi.fn(), vi.fn()));

    act(() => {
      result.current.openCreate();
    });

    await act(async () => {
      result.current.save();
    });

    expect(result.current.editing).toBe("new");
    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith(ERROR_CODES.SCHEDULING_VALIDATION.message),
    );
  });

  it("삭제 성공은 편집 상태를 닫는다", async () => {
    const onDelete = vi.fn().mockResolvedValue({ ok: true });
    const { usePositionEditor } = await import("@/features/position/hooks/usePositionEditor");
    const { result } = renderHook(() => usePositionEditor(vi.fn(), vi.fn(), onDelete));

    act(() => {
      result.current.openEdit(EXISTING_POSITION);
    });

    await act(async () => {
      result.current.remove();
    });

    expect(onDelete).toHaveBeenCalledWith({ id: "position-1" });
    await waitFor(() => expect(result.current.editing).toBeNull());
  });

  it("사용 중 삭제 거부는 편집 상태를 유지하고 안내 토스트를 띄운다", async () => {
    const onDelete = vi
      .fn()
      .mockResolvedValue({ ok: false, code: ERROR_CODE.SCHEDULING_POSITION_IN_USE });
    const { usePositionEditor } = await import("@/features/position/hooks/usePositionEditor");
    const { result } = renderHook(() => usePositionEditor(vi.fn(), vi.fn(), onDelete));

    act(() => {
      result.current.openEdit(EXISTING_POSITION);
    });

    await act(async () => {
      result.current.remove();
    });

    expect(result.current.editing).toEqual(EXISTING_POSITION);
    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith(ERROR_CODES.SCHEDULING_POSITION_IN_USE.message),
    );
  });

  it("close는 편집 상태를 닫는다", async () => {
    const { usePositionEditor } = await import("@/features/position/hooks/usePositionEditor");
    const { result } = renderHook(() => usePositionEditor(vi.fn(), vi.fn(), vi.fn()));

    act(() => {
      result.current.openCreate();
      result.current.close();
    });

    expect(result.current.editing).toBeNull();
  });
});
