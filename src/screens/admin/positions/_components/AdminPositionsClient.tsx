"use client";

import { ConfirmDialog } from "#/shared/components/common/ConfirmDialog";
import { PositionEditorCard } from "#/screens/admin/positions/_components/PositionEditorCard";
import { PositionsListPanel } from "#/screens/admin/positions/_components/PositionsListPanel";
import { useAdminPositionsScreenState } from "#/screens/admin/positions/_hooks/useAdminPositionsScreenState";

export function AdminPositionsClient() {
  const {
    allowedGender,
    canReorder,
    defaultRequiredCount,
    draggingPositionId,
    dropTargetPositionId,
    editingPositionId,
    fieldErrors,
    filteredPositions,
    isDeleting,
    isEditorOpen,
    isReordering,
    isSearchActive,
    isSaving,
    name,
    onAllowedGenderChange,
    onCancelDelete,
    onCloseEditor,
    onConfirmDelete,
    onDefaultRequiredCountChange,
    onDelete,
    onDragEnd,
    onDragStart,
    onDrop,
    onDropTargetChange,
    onEdit,
    onNameChange,
    onOpenCreate,
    onSearchTermChange,
    onSubmit,
    pendingDeletePosition,
    positions,
    searchTerm,
    serverError,
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

      {isEditorOpen ? (
        <section>
          <PositionEditorCard
            allowedGender={allowedGender}
            defaultRequiredCount={defaultRequiredCount}
            fieldErrors={fieldErrors}
            isEditing={editingPositionId !== null}
            isSaving={isSaving}
            name={name}
            onAllowedGenderChange={onAllowedGenderChange}
            onCancel={onCloseEditor}
            onDefaultRequiredCountChange={onDefaultRequiredCountChange}
            onNameChange={onNameChange}
            onSubmit={onSubmit}
            serverError={serverError}
          />
        </section>
      ) : null}

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
