import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Position } from "#/entities/positions/models/schemas/position";
import { useAdminPositionsScreenState } from "#/screens/admin/positions/_hooks/useAdminPositionsScreenState";

const createPositionMutation = {
  isPending: false,
  mutateAsync: vi.fn(),
};

const updatePositionMutation = {
  isPending: false,
  mutateAsync: vi.fn(),
};

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
  positionsQuery: { data: [] as Position[] },
  searchTerm: "",
  setSearchTerm: vi.fn(),
};

vi.mock("#/mutations/positions/hooks/useCreatePositionMutation", () => ({
  useCreatePositionMutation: () => createPositionMutation,
}));

vi.mock("#/mutations/positions/hooks/useUpdatePositionMutation", () => ({
  useUpdatePositionMutation: () => updatePositionMutation,
}));

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
  it("keeps edit mode while the dialog is closing after editing", async () => {
    positionCollectionStateMock.filteredPositions = [
      {
        allowedGender: "all",
        defaultRequiredCount: 2,
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        name: "안내",
        sortOrder: 1,
      },
    ];
    positionCollectionStateMock.positions = [
      {
        allowedGender: "all",
        defaultRequiredCount: 2,
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        name: "안내",
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
      expect(result.current.name).toBe("안내");
    });

    act(() => {
      result.current.onCloseEditor();
    });

    expect(result.current.isEditorOpen).toBe(false);
    expect(result.current.editingPositionId).toBe(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1"
    );
  });

  it("keeps the current form values while the dialog is closing and resets on the next create open", async () => {
    positionCollectionStateMock.filteredPositions = [];
    positionCollectionStateMock.positions = [];
    const { result } = renderHook(() => useAdminPositionsScreenState());

    act(() => {
      result.current.onOpenCreate();
    });

    act(() => {
      result.current.onNameChange("메인 안내");
    });

    await waitFor(() => {
      expect(result.current.name).toBe("메인 안내");
    });

    act(() => {
      result.current.onCloseEditor();
    });

    expect(result.current.isEditorOpen).toBe(false);
    expect(result.current.name).toBe("메인 안내");

    act(() => {
      result.current.onOpenCreate();
    });

    await waitFor(() => {
      expect(result.current.name).toBe("");
    });
  });
});
