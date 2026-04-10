import { useState } from "react";
import type { Position } from "#/entities/positions/models/schemas/position";
import { useDeletePositionMutation } from "#/mutations/positions/hooks/useDeletePositionMutation";
import { useReorderPositionsMutation } from "#/mutations/positions/hooks/useReorderPositionsMutation";
import { usePositionCollectionState } from "#/queries/positions/hooks/usePositionCollectionState";
import {
  readPositionDeleteErrorMessage,
  readPositionListErrorMessage,
  readPositionReorderErrorMessage,
} from "#/screens/admin/positions/_helpers/positionError";
import { useDragReorderState } from "#/shared/hooks/useDragReorderState";

type PositionEditorRequest = {
  initialPosition: Position | null;
  requestKey: number;
};

const initialEditorRequest: PositionEditorRequest = {
  initialPosition: null,
  requestKey: 0,
};

export function useAdminPositionsScreenState() {
  const {
    filteredPositions,
    positions,
    positionsQuery,
    searchTerm,
    setSearchTerm,
  } = usePositionCollectionState();
  const [editorRequest, setEditorRequest] =
    useState<PositionEditorRequest>(initialEditorRequest);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [pendingDeletePosition, setPendingDeletePosition] =
    useState<Position | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const deletePositionMutation = useDeletePositionMutation();
  const reorderPositionsMutation = useReorderPositionsMutation();
  const isReordering = reorderPositionsMutation.isPending;
  const isSearchActive = searchTerm.trim().length > 0;
  const canReorder = !isSearchActive && !isReordering;
  const resolvedListError =
    listError ??
    (positionsQuery.error
      ? readPositionListErrorMessage(positionsQuery.error)
      : null);
  const {
    clearDragState,
    draggingItemId: draggingPositionId,
    dropTargetItemId: dropTargetPositionId,
    setDropTarget,
    startDrag,
  } = useDragReorderState({
    disabled: !canReorder,
  });
  const editingPositionId = editorRequest.initialPosition?.id ?? null;

  function openCreate() {
    setPendingDeletePosition(null);
    setEditorRequest((currentRequest) => ({
      initialPosition: null,
      requestKey: currentRequest.requestKey + 1,
    }));
    setIsEditorOpen(true);
  }

  function startEdit(position: Position) {
    setPendingDeletePosition(null);
    setEditorRequest((currentRequest) => ({
      initialPosition: position,
      requestKey: currentRequest.requestKey + 1,
    }));
    setIsEditorOpen(true);
  }

  function requestRemove(position: Position) {
    setListError(null);
    setPendingDeletePosition(position);
  }

  async function confirmRemove() {
    if (!pendingDeletePosition) {
      return;
    }

    const position = pendingDeletePosition;
    setPendingDeletePosition(null);
    setListError(null);

    try {
      await deletePositionMutation.mutateAsync({ id: position.id });

      if (editingPositionId === position.id) {
        closeEditor();
      }
    } catch (nextError) {
      setListError(readPositionDeleteErrorMessage(nextError));
    }
  }

  function cancelRemove() {
    setPendingDeletePosition(null);
  }

  async function dropOnPosition(targetPositionId: string) {
    if (
      !draggingPositionId ||
      draggingPositionId === targetPositionId ||
      !canReorder
    ) {
      clearDragState();
      return;
    }

    const orderedIds = movePositionIds(
      positions.map((position) => position.id),
      draggingPositionId,
      targetPositionId
    );

    if (orderedIds.length === 0) {
      clearDragState();
      return;
    }

    try {
      setListError(null);
      await reorderPositionsMutation.mutateAsync({ positionIds: orderedIds });
    } catch (nextError) {
      setListError(readPositionReorderErrorMessage(nextError));
    } finally {
      clearDragState();
    }
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setPendingDeletePosition(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      closeEditor();
    }
  }

  return {
    canReorder,
    draggingPositionId,
    dropTargetPositionId,
    editorInitialPosition: editorRequest.initialPosition,
    editorRequestKey: editorRequest.requestKey,
    editingPositionId,
    filteredPositions,
    isDeleting: deletePositionMutation.isPending,
    isEditorOpen,
    isReordering,
    isSearchActive,
    listError: resolvedListError,
    onCancelDelete: cancelRemove,
    onCloseEditor: closeEditor,
    onConfirmDelete: confirmRemove,
    onDelete: requestRemove,
    onDragEnd: clearDragState,
    onDragStart: startDrag,
    onDrop: dropOnPosition,
    onDropTargetChange: setDropTarget,
    onEdit: startEdit,
    onOpenChange: handleOpenChange,
    onOpenCreate: openCreate,
    onSearchTermChange: setSearchTerm,
    pendingDeletePosition,
    positions,
    searchTerm,
  };
}

function movePositionIds(
  positionIds: string[],
  sourcePositionId: string,
  targetPositionId: string
) {
  const nextPositionIds = [...positionIds];
  const sourceIndex = nextPositionIds.indexOf(sourcePositionId);
  const targetIndex = nextPositionIds.indexOf(targetPositionId);

  if (sourceIndex === -1 || targetIndex === -1) {
    return [];
  }

  const [movedPositionId] = nextPositionIds.splice(sourceIndex, 1);
  nextPositionIds.splice(targetIndex, 0, movedPositionId);

  return nextPositionIds;
}
