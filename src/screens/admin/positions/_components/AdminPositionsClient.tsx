"use client";

import { ConfirmDialog } from "#/shared/components/common/ConfirmDialog";
import { PositionEditorDialog } from "#/screens/admin/positions/_components/PositionEditorDialog";
import { PositionsListPanel } from "#/screens/admin/positions/_components/PositionsListPanel";
import { useAdminPositionsScreenState } from "#/screens/admin/positions/_hooks/useAdminPositionsScreenState";

export function AdminPositionsClient() {
  const {
    canReorder,
    draggingPositionId,
    dropTargetPositionId,
    editorInitialPosition,
    editorRequestKey,
    filteredPositions,
    isDeleting,
    isEditorOpen,
    isReordering,
    isSearchActive,
    listError,
    onCancelDelete,
    onConfirmDelete,
    onDelete,
    onDragEnd,
    onDragStart,
    onDrop,
    onDropTargetChange,
    onEdit,
    onOpenChange,
    onOpenCreate,
    onSearchTermChange,
    pendingDeletePosition,
    positions,
    searchTerm,
  } = useAdminPositionsScreenState();

  return (
    <>
      <section>
        <PositionsListPanel
          canReorder={canReorder}
          draggingPositionId={draggingPositionId}
          dropTargetPositionId={dropTargetPositionId}
          isDeleting={isDeleting}
          isReordering={isReordering}
          isSearchActive={isSearchActive}
          listError={listError}
          onCreate={onOpenCreate}
          onDelete={onDelete}
          onDragEnd={onDragEnd}
          onDragStart={onDragStart}
          onDrop={onDrop}
          onDropTargetChange={onDropTargetChange}
          onEdit={onEdit}
          onSearchTermChange={onSearchTermChange}
          positions={filteredPositions}
          searchTerm={searchTerm}
          totalCount={positions.length}
        />
      </section>

      <PositionEditorDialog
        initialPosition={editorInitialPosition}
        key={editorRequestKey}
        onOpenChange={onOpenChange}
        open={isEditorOpen}
        requestKey={editorRequestKey}
      />

      <ConfirmDialog
        confirmLabel="삭제"
        description={
          pendingDeletePosition
            ? `"${pendingDeletePosition.name}" 포지션을 삭제합니다. 이 작업은 되돌릴 수 없습니다.`
            : "선택한 포지션을 삭제합니다. 이 작업은 되돌릴 수 없습니다."
        }
        onConfirm={onConfirmDelete}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            onCancelDelete();
          }
        }}
        open={pendingDeletePosition !== null}
        title="포지션을 삭제할까요?"
      />
    </>
  );
}
