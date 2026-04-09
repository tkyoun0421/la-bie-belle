"use client";

import { ConfirmDialog } from "#/shared/components/common/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "#/shared/components/ui/dialog";
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
    error,
    filteredPositions,
    isDeleting,
    isEditorOpen,
    isReordering,
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
    onOpenChange,
    onOpenCreate,
    onSearchTermChange,
    onSubmit,
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

      <Dialog onOpenChange={onOpenChange} open={isEditorOpen}>
        <DialogContent
          className="max-w-[36rem] border-0 bg-transparent p-0 shadow-none"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">
            {editingPositionId ? "포지션 수정" : "새 포지션 추가"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            포지션 이름, 가능 성별, 기본 필수 인원을 입력하고 저장합니다.
          </DialogDescription>
          <PositionEditorCard
            allowedGender={allowedGender}
            defaultRequiredCount={defaultRequiredCount}
            error={error}
            isEditing={editingPositionId !== null}
            isSaving={isSaving}
            name={name}
            onAllowedGenderChange={onAllowedGenderChange}
            onCancel={onCloseEditor}
            onDefaultRequiredCountChange={onDefaultRequiredCountChange}
            onNameChange={onNameChange}
            onSubmit={onSubmit}
          />
        </DialogContent>
      </Dialog>

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
