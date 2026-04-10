import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminPositionsClient } from "#/screens/admin/positions/_components/AdminPositionsClient";

const {
  mockedPositionsListPanel,
  mockUseAdminPositionsScreenState,
} = vi.hoisted(() => ({
  mockedPositionsListPanel: vi.fn(() => <div>positions-list-panel</div>),
  mockUseAdminPositionsScreenState: vi.fn(),
}));

const createPositionMutation = {
  isPending: false,
  mutateAsync: vi.fn(),
};

const updatePositionMutation = {
  isPending: false,
  mutateAsync: vi.fn(),
};

vi.mock("#/screens/admin/positions/_hooks/useAdminPositionsScreenState", () => ({
  useAdminPositionsScreenState: mockUseAdminPositionsScreenState,
}));

vi.mock("#/screens/admin/positions/_components/PositionsListPanel", () => ({
  PositionsListPanel: mockedPositionsListPanel,
}));

vi.mock("#/shared/components/common/ConfirmDialog", () => ({
  ConfirmDialog: () => null,
}));

vi.mock("#/mutations/positions/hooks/useCreatePositionMutation", () => ({
  useCreatePositionMutation: () => createPositionMutation,
}));

vi.mock("#/mutations/positions/hooks/useUpdatePositionMutation", () => ({
  useUpdatePositionMutation: () => updatePositionMutation,
}));

function createScreenState(overrides: Record<string, unknown> = {}) {
  return {
    canReorder: true,
    draggingPositionId: null,
    dropTargetPositionId: null,
    editorInitialPosition: null,
    editorRequestKey: 1,
    editingPositionId: null,
    filteredPositions: [],
    isDeleting: false,
    isEditorOpen: false,
    isReordering: false,
    isSearchActive: false,
    listError: null,
    onCancelDelete: vi.fn(),
    onCloseEditor: vi.fn(),
    onConfirmDelete: vi.fn(),
    onDelete: vi.fn(),
    onDragEnd: vi.fn(),
    onDragStart: vi.fn(),
    onDrop: vi.fn(),
    onDropTargetChange: vi.fn(),
    onEdit: vi.fn(),
    onOpenChange: vi.fn(),
    onOpenCreate: vi.fn(),
    onSearchTermChange: vi.fn(),
    pendingDeletePosition: null,
    positions: [],
    searchTerm: "",
    ...overrides,
  };
}

describe("AdminPositionsClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the editor inside a dialog when create or edit is open", () => {
    mockUseAdminPositionsScreenState.mockReturnValue(
      createScreenState({
        isEditorOpen: true,
      })
    );

    render(<AdminPositionsClient />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("does not rerender the positions list while typing in the dialog", () => {
    mockUseAdminPositionsScreenState.mockReturnValue(
      createScreenState({
        isEditorOpen: true,
      })
    );

    render(<AdminPositionsClient />);

    expect(mockedPositionsListPanel).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "draft" },
    });

    expect(mockedPositionsListPanel).toHaveBeenCalledTimes(1);
  });

  it("resets the dialog draft when a new editor request key is opened", () => {
    mockUseAdminPositionsScreenState.mockReturnValue(
      createScreenState({
        isEditorOpen: true,
        editorRequestKey: 1,
      })
    );

    const { rerender } = render(<AdminPositionsClient />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "draft" },
    });

    expect(screen.getByRole("textbox")).toHaveValue("draft");

    mockUseAdminPositionsScreenState.mockReturnValue(
      createScreenState({
        isEditorOpen: true,
        editorRequestKey: 2,
      })
    );

    rerender(<AdminPositionsClient />);

    expect(screen.getByRole("textbox")).toHaveValue("");
  });
});
