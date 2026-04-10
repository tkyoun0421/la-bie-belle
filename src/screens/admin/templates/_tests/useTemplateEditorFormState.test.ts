import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createEventTemplateError,
  eventTemplateErrorCodes,
} from "#/entities/events/models/errors/eventTemplateError";
import { useTemplateEditorFormState } from "#/screens/admin/templates/_hooks/useTemplateEditorFormState";

const createTemplateMutation = {
  isPending: false,
  mutateAsync: vi.fn(),
};

const updateTemplateMutation = {
  isPending: false,
  mutateAsync: vi.fn(),
};

vi.mock("#/mutations/events/hooks/useCreateEventTemplateMutation", () => ({
  useCreateEventTemplateMutation: () => createTemplateMutation,
}));

vi.mock("#/mutations/events/hooks/useUpdateEventTemplateMutation", () => ({
  useUpdateEventTemplateMutation: () => updateTemplateMutation,
}));

vi.mock("#/shared/hooks/useDragReorderState", () => ({
  useDragReorderState: () => ({
    clearDragState: vi.fn(),
    draggingItemId: null,
    dropTargetItemId: null,
    setDropTarget: vi.fn(),
    startDrag: vi.fn(),
  }),
}));

describe("useTemplateEditorFormState", () => {
  const positionId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("locks the primary template toggle for the first template", async () => {
    const { result } = renderHook(() =>
      useTemplateEditorFormState({
        defaultPositionId: positionId,
        defaultRequiredCount: 2,
        defaultRequiredCountByPositionId: {
          [positionId]: 2,
        },
        defaultTemplateValues: {
          firstServiceAt: "10:30",
          isPrimary: true,
          lastServiceEndAt: "16:00",
          name: "Main Hall",
          slotDefaults: [
            {
              positionId,
              requiredCount: 2,
            },
          ],
        },
        initialTemplate: null,
        onSubmitted: vi.fn(),
        positionIds: [positionId],
        positionNameById: {
          [positionId]: "Guide",
        },
        templatesCount: 0,
      })
    );

    expect(result.current.isPrimaryLocked).toBe(true);
    expect(result.current.form.getValues("isPrimary")).toBe(true);

    act(() => {
      result.current.updatePrimary(false);
    });

    await waitFor(() => {
      expect(result.current.form.getValues("isPrimary")).toBe(true);
    });
  });

  it("surfaces validation errors on matching fields", async () => {
    const { result } = renderHook(() =>
      useTemplateEditorFormState({
        defaultPositionId: positionId,
        defaultRequiredCount: 2,
        defaultRequiredCountByPositionId: {
          [positionId]: 2,
        },
        defaultTemplateValues: {
          firstServiceAt: "10:30",
          isPrimary: true,
          lastServiceEndAt: "16:00",
          name: "",
          slotDefaults: [
            {
              positionId,
              requiredCount: 2,
            },
          ],
        },
        initialTemplate: null,
        onSubmitted: vi.fn(),
        positionIds: [positionId],
        positionNameById: {
          [positionId]: "Guide",
        },
        templatesCount: 0,
      })
    );

    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => {
      expect(result.current.form.getFieldState("name").error?.message).toBeTruthy();
      expect(result.current.serverError).toBeNull();
    });
  });

  it("asks for confirmation before going below the default required count", async () => {
    const { result } = renderHook(() =>
      useTemplateEditorFormState({
        defaultPositionId: positionId,
        defaultRequiredCount: 2,
        defaultRequiredCountByPositionId: {
          [positionId]: 2,
        },
        defaultTemplateValues: {
          firstServiceAt: "10:30",
          isPrimary: false,
          lastServiceEndAt: "16:00",
          name: "Main Hall",
          slotDefaults: [
            {
              positionId,
              requiredCount: 2,
            },
          ],
        },
        initialTemplate: null,
        onSubmitted: vi.fn(),
        positionIds: [positionId],
        positionNameById: {
          [positionId]: "Guide",
        },
        templatesCount: 1,
      })
    );

    act(() => {
      result.current.updateSlot(0, "requiredCount", "1");
    });

    await waitFor(() => {
      expect(result.current.pendingBelowDefaultRequiredCount).not.toBeNull();
      expect(result.current.form.getValues("slotDefaults.0.requiredCount")).toBe(2);
    });

    act(() => {
      result.current.confirmBelowDefaultRequiredCount();
    });

    await waitFor(() => {
      expect(result.current.pendingBelowDefaultRequiredCount).toBeNull();
      expect(result.current.form.getValues("slotDefaults.0.requiredCount")).toBe(1);
    });
  });

  it("submits and forwards the saved template id", async () => {
    const onSubmitted = vi.fn();

    createTemplateMutation.mutateAsync.mockResolvedValueOnce({
      id: "template-1",
    });

    const { result } = renderHook(() =>
      useTemplateEditorFormState({
        defaultPositionId: positionId,
        defaultRequiredCount: 2,
        defaultRequiredCountByPositionId: {
          [positionId]: 2,
        },
        defaultTemplateValues: {
          firstServiceAt: "10:30",
          isPrimary: true,
          lastServiceEndAt: "16:00",
          name: "Main Hall",
          slotDefaults: [
            {
              positionId,
              requiredCount: 2,
            },
          ],
        },
        initialTemplate: null,
        onSubmitted,
        positionIds: [positionId],
        positionNameById: {
          [positionId]: "Guide",
        },
        templatesCount: 0,
      })
    );

    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => {
      expect(createTemplateMutation.mutateAsync).toHaveBeenCalledTimes(1);
      expect(onSubmitted).toHaveBeenCalledWith("template-1");
    });
  });

  it("maps template error codes to editor messages", async () => {
    updateTemplateMutation.mutateAsync.mockRejectedValueOnce(
      createEventTemplateError(eventTemplateErrorCodes.updateTargetNotFound)
    );

    const { result } = renderHook(() =>
      useTemplateEditorFormState({
        defaultPositionId: positionId,
        defaultRequiredCount: 2,
        defaultRequiredCountByPositionId: {
          [positionId]: 2,
        },
        defaultTemplateValues: {
          firstServiceAt: "10:30",
          isPrimary: false,
          lastServiceEndAt: "16:00",
          name: "Main Hall",
          slotDefaults: [
            {
              positionId,
              requiredCount: 2,
            },
          ],
        },
        initialTemplate: {
          id: "99999999-9999-4999-8999-999999999999",
          name: "Main Hall",
          isPrimary: false,
          timeLabel: "10:30 - 16:00",
          firstServiceAt: "10:30",
          lastServiceEndAt: "16:00",
          createdAt: "2026-04-10T01:00:00.000Z",
          slotDefaults: [
            {
              positionId,
              positionName: "Guide",
              requiredCount: 2,
              trainingCount: 0,
            },
          ],
        },
        onSubmitted: vi.fn(),
        positionIds: [positionId],
        positionNameById: {
          [positionId]: "Guide",
        },
        templatesCount: 1,
      })
    );

    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => {
      expect(result.current.serverError).toBe(
        "선택한 행사 템플릿을 찾지 못했습니다."
      );
    });
  });
});
