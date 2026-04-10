import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Position } from "#/entities/positions/models/schemas/position";
import { useAdminPositionsScreenState } from "#/screens/admin/positions/_hooks/useAdminPositionsScreenState";

const deletePositionMutation = {
  isPending: false,
  mutateAsync: vi.fn(),
};

const reorderPositionsMutation = {
  isPending: false,
  mutateAsync: vi.fn(),
};

const positionCollectionStateMock = {
  filteredPositions: [] as Position[],
  positions: [] as Position[],
  positionsQuery: { data: [] as Position[], error: null as unknown },
  searchTerm: "",
  setSearchTerm: vi.fn(),
};

vi.mock("#/mutations/positions/hooks/useDeletePositionMutation", () => ({
  useDeletePositionMutation: () => deletePositionMutation,
}));

vi.mock("#/mutations/positions/hooks/useReorderPositionsMutation", () => ({
  useReorderPositionsMutation: () => reorderPositionsMutation,
}));

vi.mock("#/queries/positions/hooks/usePositionCollectionState", () => ({
  usePositionCollectionState: () => positionCollectionStateMock,
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

describe("useAdminPositionsScreenState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    positionCollectionStateMock.filteredPositions = [];
    positionCollectionStateMock.positions = [];
    positionCollectionStateMock.positionsQuery = {
      data: [],
      error: null,
    };
    positionCollectionStateMock.searchTerm = "";
  });

  it("keeps the editing target while the dialog is closing after editing", async () => {
    positionCollectionStateMock.filteredPositions = [
      {
        allowedGender: "all",
        defaultRequiredCount: 2,
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        name: "main",
        sortOrder: 1,
      },
    ];
    positionCollectionStateMock.positions = [
      {
        allowedGender: "all",
        defaultRequiredCount: 2,
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        name: "main",
        sortOrder: 1,
      },
    ];

    const { result } = renderHook(() => useAdminPositionsScreenState());

    act(() => {
      result.current.onEdit(positionCollectionStateMock.positions[0]!);
    });

    await waitFor(() => {
      expect(result.current.editingPositionId).toBe(
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1"
      );
      expect(result.current.editorInitialPosition?.name).toBe("main");
    });

    act(() => {
      result.current.onCloseEditor();
    });

    expect(result.current.isEditorOpen).toBe(false);
    expect(result.current.editingPositionId).toBe(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1"
    );
  });

  it("increments the editor request key when a new create session opens", () => {
    const { result } = renderHook(() => useAdminPositionsScreenState());

    expect(result.current.editorRequestKey).toBe(0);

    act(() => {
      result.current.onOpenCreate();
    });

    expect(result.current.editorRequestKey).toBe(1);

    act(() => {
      result.current.onCloseEditor();
      result.current.onOpenCreate();
    });

    expect(result.current.editorRequestKey).toBe(2);
  });
});
