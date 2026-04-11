import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  eventTemplateErrors,
  eventTemplateErrorCodes,
} from "#/entities/events/models/errors/eventTemplateError";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import { useTemplateDeleteDialogState } from "#/screens/admin/templates/_hooks/useTemplateDeleteDialogState";

const deleteTemplateMutation = {
  error: null as unknown,
  isPending: false,
  mutateAsync: vi.fn(),
  reset: vi.fn(),
};

vi.mock("#/mutations/events/hooks/useDeleteEventTemplateMutation", () => ({
  useDeleteEventTemplateMutation: () => deleteTemplateMutation,
}));

const template: EventTemplate = {
  createdAt: "2026-04-11T08:00:00.000Z",
  firstServiceAt: "10:30",
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  isPrimary: false,
  lastServiceEndAt: "16:00",
  name: "주말 웨딩 기본형",
  slotDefaults: [
    {
      positionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      positionName: "안내",
      requiredCount: 2,
      trainingCount: 0,
    },
  ],
  timeLabel: "10:30 - 16:00",
};

describe("useTemplateDeleteDialogState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteTemplateMutation.error = null;
    deleteTemplateMutation.isPending = false;
  });

  it("opens a delete session and resets the previous mutation state", () => {
    const { result } = renderHook(() => useTemplateDeleteDialogState());

    act(() => {
      result.current.onDelete(template);
    });

    expect(deleteTemplateMutation.reset).toHaveBeenCalledTimes(1);
    expect(result.current.templateToDelete?.id).toBe(template.id);
  });

  it("closes the dialog after a successful deletion", async () => {
    deleteTemplateMutation.mutateAsync.mockResolvedValueOnce(template.id);

    const { result } = renderHook(() => useTemplateDeleteDialogState());

    act(() => {
      result.current.onDelete(template);
    });

    await act(async () => {
      await result.current.onConfirmDelete();
    });

    await waitFor(() => {
      expect(deleteTemplateMutation.mutateAsync).toHaveBeenCalledWith({
        id: template.id,
      });
      expect(result.current.templateToDelete).toBeNull();
    });
  });

  it("keeps the dialog open when deletion fails", async () => {
    deleteTemplateMutation.mutateAsync.mockRejectedValueOnce(
      eventTemplateErrors.create(eventTemplateErrorCodes.deleteLastForbidden)
    );

    const { result } = renderHook(() => useTemplateDeleteDialogState());

    act(() => {
      result.current.onDelete(template);
    });

    await act(async () => {
      await result.current.onConfirmDelete();
    });

    await waitFor(() => {
      expect(result.current.templateToDelete?.id).toBe(template.id);
    });
  });

  it("maps mutation errors without duplicating them into local state", async () => {
    deleteTemplateMutation.error = eventTemplateErrors.create(
      eventTemplateErrorCodes.deleteLastForbidden
    );

    const { result } = renderHook(() => useTemplateDeleteDialogState());

    await waitFor(() => {
      expect(result.current.deleteError).toBe("마지막 템플릿은 삭제할 수 없습니다.");
    });
  });
});
