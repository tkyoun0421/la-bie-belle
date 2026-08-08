import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Position } from "@/entities/position/model/position";
import type { ScheduleRequirementRow } from "@/entities/schedule/types/schedule-requirement";
import { ERROR_CODE, ERROR_CODES } from "@/shared/config/error-codes.config";

const showSnackbar = vi.fn();
vi.mock("@/shared/ui/snackbar", () => ({ showSnackbar }));

afterEach(() => {
  vi.clearAllMocks();
});

function makePosition(overrides: Partial<Position> = {}): Position {
  return {
    id: "position-team-lead",
    name: "팀장",
    code: "team_lead",
    defaultRequiredCount: 1,
    genderRequirement: "any",
    isDefault: false,
    isActive: true,
    ...overrides,
  };
}

const ROW: ScheduleRequirementRow = {
  positionId: "position-team-lead",
  positionName: "팀장",
  requiredCount: 1,
};

describe("useRequirementEditor", () => {
  it("표에 없는 활성 포지션을 missing으로 파생한다", async () => {
    const { useRequirementEditor } =
      await import("@/features/requirement/hooks/useRequirementEditor");
    const scan = makePosition({ id: "position-scan", name: "스캔", code: null });
    const { result } = renderHook(() =>
      useRequirementEditor(
        { scheduleId: "schedule-1", rows: [ROW], activePositions: [makePosition(), scan] },
        vi.fn(),
        vi.fn(),
      ),
    );

    expect(result.current.missing).toEqual([scan]);
  });

  it("activePositions가 rows를 전부 포함하면 missing은 빈 배열이다", async () => {
    const { useRequirementEditor } =
      await import("@/features/requirement/hooks/useRequirementEditor");
    const { result } = renderHook(() =>
      useRequirementEditor(
        { scheduleId: "schedule-1", rows: [ROW], activePositions: [makePosition()] },
        vi.fn(),
        vi.fn(),
      ),
    );

    expect(result.current.missing).toEqual([]);
  });

  it("updateCount는 로컬 상태만 바꾸고 서버를 호출하지 않는다", async () => {
    const onSet = vi.fn();
    const { useRequirementEditor } =
      await import("@/features/requirement/hooks/useRequirementEditor");
    const { result } = renderHook(() =>
      useRequirementEditor(
        { scheduleId: "schedule-1", rows: [ROW], activePositions: [makePosition()] },
        onSet,
        vi.fn(),
      ),
    );

    act(() => {
      result.current.updateCount("position-team-lead", 5);
    });

    expect(result.current.rows[0]?.requiredCount).toBe(5);
    expect(onSet).not.toHaveBeenCalled();
  });

  it("saveCount는 현재 로컬 값으로 setRequirement Action을 호출한다", async () => {
    const onSet = vi.fn().mockResolvedValue({ ok: true });
    const { useRequirementEditor } =
      await import("@/features/requirement/hooks/useRequirementEditor");
    const { result } = renderHook(() =>
      useRequirementEditor(
        { scheduleId: "schedule-1", rows: [ROW], activePositions: [makePosition()] },
        onSet,
        vi.fn(),
      ),
    );

    act(() => {
      result.current.updateCount("position-team-lead", 3);
    });
    await act(async () => {
      result.current.saveCount("position-team-lead");
    });

    expect(onSet).toHaveBeenCalledWith({
      scheduleId: "schedule-1",
      positionId: "position-team-lead",
      requiredCount: 3,
    });
  });

  it("saveCount 실패는 로컬 값을 되돌리지 않고 에러 토스트만 띄운다", async () => {
    const onSet = vi.fn().mockResolvedValue({ ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION });
    const { useRequirementEditor } =
      await import("@/features/requirement/hooks/useRequirementEditor");
    const { result } = renderHook(() =>
      useRequirementEditor(
        { scheduleId: "schedule-1", rows: [ROW], activePositions: [makePosition()] },
        onSet,
        vi.fn(),
      ),
    );

    act(() => {
      result.current.updateCount("position-team-lead", 3);
    });
    await act(async () => {
      result.current.saveCount("position-team-lead");
    });

    expect(result.current.rows[0]?.requiredCount).toBe(3);
    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith(ERROR_CODES.SCHEDULING_VALIDATION.message),
    );
  });

  it("removeRow 성공은 rows에서 행을 제거하고 missing에 다시 나타난다", async () => {
    const onRemove = vi.fn().mockResolvedValue({ ok: true });
    const { useRequirementEditor } =
      await import("@/features/requirement/hooks/useRequirementEditor");
    const { result } = renderHook(() =>
      useRequirementEditor(
        { scheduleId: "schedule-1", rows: [ROW], activePositions: [makePosition()] },
        vi.fn(),
        onRemove,
      ),
    );

    await act(async () => {
      result.current.removeRow("position-team-lead");
    });

    expect(onRemove).toHaveBeenCalledWith({
      scheduleId: "schedule-1",
      positionId: "position-team-lead",
    });
    expect(result.current.rows).toEqual([]);
    expect(result.current.missing).toEqual([makePosition()]);
  });

  it("removeRow 실패는 rows를 그대로 두고 에러 토스트를 띄운다", async () => {
    const onRemove = vi
      .fn()
      .mockResolvedValue({ ok: false, code: ERROR_CODE.SCHEDULING_STATUS_CONFLICT });
    const { useRequirementEditor } =
      await import("@/features/requirement/hooks/useRequirementEditor");
    const { result } = renderHook(() =>
      useRequirementEditor(
        { scheduleId: "schedule-1", rows: [ROW], activePositions: [makePosition()] },
        vi.fn(),
        onRemove,
      ),
    );

    await act(async () => {
      result.current.removeRow("position-team-lead");
    });

    expect(result.current.rows).toEqual([ROW]);
    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith(ERROR_CODES.SCHEDULING_STATUS_CONFLICT.message),
    );
  });

  it("addMissing 성공은 rows에 기본 인원수로 새 행을 추가한다", async () => {
    const onSet = vi.fn().mockResolvedValue({ ok: true });
    const { useRequirementEditor } =
      await import("@/features/requirement/hooks/useRequirementEditor");
    const scan = makePosition({ id: "position-scan", name: "스캔", defaultRequiredCount: 2 });
    const { result } = renderHook(() =>
      useRequirementEditor(
        { scheduleId: "schedule-1", rows: [], activePositions: [scan] },
        onSet,
        vi.fn(),
      ),
    );

    await act(async () => {
      result.current.addMissing("position-scan");
    });

    expect(onSet).toHaveBeenCalledWith({
      scheduleId: "schedule-1",
      positionId: "position-scan",
      requiredCount: 2,
    });
    expect(result.current.rows).toEqual([
      { positionId: "position-scan", positionName: "스캔", requiredCount: 2 },
    ]);
    expect(result.current.missing).toEqual([]);
  });
});
