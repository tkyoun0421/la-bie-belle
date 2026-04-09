import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import { useTemplateEditorState } from "#/screens/admin/templates/_hooks/useTemplateEditorState";

const createTemplateMutation = {
  isPending: false,
  mutateAsync: vi.fn(),
};

const updateTemplateMutation = {
  isPending: false,
  mutateAsync: vi.fn(),
};

const deleteTemplateMutation = {
  isPending: false,
  mutateAsync: vi.fn(),
};

vi.mock("#/mutations/events/hooks/useCreateEventTemplateMutation", () => ({
  useCreateEventTemplateMutation: () => createTemplateMutation,
}));

vi.mock("#/mutations/events/hooks/useUpdateEventTemplateMutation", () => ({
  useUpdateEventTemplateMutation: () => updateTemplateMutation,
}));

vi.mock("#/mutations/events/hooks/useDeleteEventTemplateMutation", () => ({
  useDeleteEventTemplateMutation: () => deleteTemplateMutation,
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

describe("useTemplateEditorState", () => {
  it("locks the representative checkbox for the first template and prevents unchecking it", async () => {
    const defaultTemplateValues = {
      firstServiceAt: "10:30",
      isPrimary: true,
      lastServiceEndAt: "16:00",
      name: "",
      slotDefaults: [
        {
          positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          requiredCount: 2,
        },
      ],
    };

    const { result } = renderHook(() =>
      useTemplateEditorState({
        defaultPositionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        defaultRequiredCount: 2,
        defaultRequiredCountByPositionId: {
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1": 2,
        },
        defaultTemplateValues,
        highlightedTemplateId: null,
        positionIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1"],
        positionNameById: {
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1": "안내",
        },
        setHighlightedTemplateId: vi.fn(),
        setSearchTerm: vi.fn(),
        templates: [] satisfies EventTemplate[],
      })
    );

    act(() => {
      result.current.openCreate();
    });

    expect(result.current.isPrimaryLocked).toBe(true);
    expect(result.current.formState.isPrimary).toBe(true);

    act(() => {
      result.current.updatePrimary(false);
    });

    await waitFor(() => {
      expect(result.current.formState.isPrimary).toBe(true);
    });
  });

  it("blocks deleting the representative template in the editor state", async () => {
    const defaultTemplateValues = {
      firstServiceAt: "10:30",
      isPrimary: false,
      lastServiceEndAt: "16:00",
      name: "",
      slotDefaults: [
        {
          positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          requiredCount: 2,
        },
      ],
    };
    const primaryTemplate: EventTemplate = {
      createdAt: "2026-04-10T01:00:00.000Z",
      firstServiceAt: "10:30",
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
      isPrimary: true,
      lastServiceEndAt: "16:00",
      name: "대표 템플릿",
      slotDefaults: [
        {
          positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          positionName: "안내",
          requiredCount: 2,
          trainingCount: 0,
        },
      ],
      timeLabel: "10:30 - 16:00",
    };

    const { result } = renderHook(() =>
      useTemplateEditorState({
        defaultPositionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        defaultRequiredCount: 2,
        defaultRequiredCountByPositionId: {
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1": 2,
        },
        defaultTemplateValues,
        highlightedTemplateId: null,
        positionIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1"],
        positionNameById: {
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1": "안내",
        },
        setHighlightedTemplateId: vi.fn(),
        setSearchTerm: vi.fn(),
        templates: [primaryTemplate],
      })
    );

    act(() => {
      result.current.remove(primaryTemplate);
    });

    await waitFor(() => {
      expect(result.current.pendingDeleteTemplate).toBeNull();
      expect(result.current.error).toBe("대표 템플릿은 삭제할 수 없습니다.");
    });
  });

  it("keeps edit mode while the dialog is closing after editing", async () => {
    const defaultTemplateValues = {
      firstServiceAt: "10:30",
      isPrimary: false,
      lastServiceEndAt: "16:00",
      name: "",
      slotDefaults: [
        {
          positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          requiredCount: 2,
        },
      ],
    };
    const templates: EventTemplate[] = [
      {
        createdAt: "2026-04-10T01:00:00.000Z",
        firstServiceAt: "10:30",
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
        isPrimary: false,
        lastServiceEndAt: "16:00",
        name: "메인 템플릿",
        slotDefaults: [
          {
            positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
            positionName: "안내",
            requiredCount: 2,
            trainingCount: 0,
          },
        ],
        timeLabel: "10:30 - 16:00",
      },
    ];

    const { result } = renderHook(() =>
      useTemplateEditorState({
        defaultPositionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        defaultRequiredCount: 2,
        defaultRequiredCountByPositionId: {
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1": 2,
        },
        defaultTemplateValues,
        highlightedTemplateId: null,
        positionIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1"],
        positionNameById: {
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1": "안내",
        },
        setHighlightedTemplateId: vi.fn(),
        setSearchTerm: vi.fn(),
        templates,
      })
    );

    act(() => {
      result.current.startEdit(templates[0]!);
    });

    await waitFor(() => {
      expect(result.current.editingTemplateId).toBe(
        "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2"
      );
      expect(result.current.formState.name).toBe("메인 템플릿");
    });

    act(() => {
      result.current.closeEditor();
    });

    expect(result.current.isEditorOpen).toBe(false);
    expect(result.current.editingTemplateId).toBe(
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2"
    );
  });

  it("keeps the current form values while the dialog is closing and resets on the next create open", async () => {
    const defaultTemplateValues = {
      firstServiceAt: "10:30",
      isPrimary: true,
      lastServiceEndAt: "16:00",
      name: "",
      slotDefaults: [
        {
          positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          requiredCount: 2,
        },
      ],
    };

    const { result } = renderHook(() =>
      useTemplateEditorState({
        defaultPositionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        defaultRequiredCount: 2,
        defaultRequiredCountByPositionId: {
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1": 2,
        },
        defaultTemplateValues,
        highlightedTemplateId: null,
        positionIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1"],
        positionNameById: {
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1": "안내",
        },
        setHighlightedTemplateId: vi.fn(),
        setSearchTerm: vi.fn(),
        templates: [] satisfies EventTemplate[],
      })
    );

    act(() => {
      result.current.openCreate();
    });

    act(() => {
      result.current.updateField("name", "테스트 템플릿");
    });

    await waitFor(() => {
      expect(result.current.formState.name).toBe("테스트 템플릿");
    });

    act(() => {
      result.current.closeEditor();
    });

    expect(result.current.isEditorOpen).toBe(false);
    expect(result.current.formState.name).toBe("테스트 템플릿");

    act(() => {
      result.current.openCreate();
    });

    await waitFor(() => {
      expect(result.current.formState.name).toBe("");
    });
  });
});
