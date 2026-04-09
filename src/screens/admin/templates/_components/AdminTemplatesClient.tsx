"use client";

import { ConfirmDialog } from "#/shared/components/common/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "#/shared/components/ui/dialog";
import { EventTemplateEditorCard } from "#/screens/admin/templates/_components/EventTemplateEditorCard";
import { EventTemplatesListPanel } from "#/screens/admin/templates/_components/EventTemplatesListPanel";
import { useAdminTemplatesScreenState } from "#/screens/admin/templates/_hooks/useAdminTemplatesScreenState";

export function AdminTemplatesClient() {
  const {
    deletePending,
    draggingSlotKey,
    dropTargetSlotKey,
    editingTemplateId,
    error,
    filteredTemplates,
    formState,
    highlightedTemplateId,
    isEditorOpen,
    isPrimaryLocked,
    isSaving,
    onAddSlotRow,
    onCancelBelowDefaultRequiredCount,
    onCancelDelete,
    onCloseEditor,
    onConfirmBelowDefaultRequiredCount,
    onConfirmDelete,
    onDelete,
    onEdit,
    onFieldChange,
    onOpenChange,
    onOpenCreate,
    onPrimaryChange,
    onRemoveSlotRow,
    onSearchTermChange,
    onSlotDragEnd,
    onSlotDragStart,
    onSlotDrop,
    onSlotDropTargetChange,
    onSubmit,
    onUpdateSlot,
    pendingBelowDefaultRequiredCount,
    pendingDeleteTemplate,
    positionOptions,
    searchTerm,
    slotRows,
  } = useAdminTemplatesScreenState();

  return (
    <>
      <section>
        <EventTemplatesListPanel
          deletePending={deletePending}
          editingTemplateId={isEditorOpen ? editingTemplateId : null}
          highlightedTemplateId={highlightedTemplateId}
          onCreate={onOpenCreate}
          onDelete={onDelete}
          onEdit={onEdit}
          onSearchTermChange={onSearchTermChange}
          searchTerm={searchTerm}
          templates={filteredTemplates}
        />
      </section>

      <Dialog onOpenChange={onOpenChange} open={isEditorOpen}>
        <DialogContent
          className="max-w-[54rem] border-0 bg-transparent p-0 shadow-none"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">
            {editingTemplateId ? "템플릿 수정" : "새 템플릿 추가"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            템플릿 기본 정보와 슬롯 구성을 입력합니다.
          </DialogDescription>
          <EventTemplateEditorCard
            canManageSlots={positionOptions.length > 0}
            draggingSlotKey={draggingSlotKey}
            dropTargetSlotKey={dropTargetSlotKey}
            editingTemplateId={editingTemplateId}
            error={error}
            formState={formState}
            isPrimaryLocked={isPrimaryLocked}
            isSaving={isSaving}
            onAddSlotRow={onAddSlotRow}
            onCancel={onCloseEditor}
            onFieldChange={onFieldChange}
            onPrimaryChange={onPrimaryChange}
            onRemoveSlotRow={onRemoveSlotRow}
            onSlotDragEnd={onSlotDragEnd}
            onSlotDragStart={onSlotDragStart}
            onSlotDrop={onSlotDrop}
            onSlotDropTargetChange={onSlotDropTargetChange}
            onSubmit={onSubmit}
            onUpdateSlot={onUpdateSlot}
            positionOptions={positionOptions}
            slotRows={slotRows}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        confirmLabel="계속 진행"
        description={
          pendingBelowDefaultRequiredCount
            ? `${pendingBelowDefaultRequiredCount.positionName}의 기본 필수 인원은 ${pendingBelowDefaultRequiredCount.positionDefaultRequiredCount}명입니다. ${pendingBelowDefaultRequiredCount.nextRequiredCount}명으로 저장하면 이 템플릿에만 별도 값이 적용됩니다. 계속할까요?`
            : "기본 필수 인원보다 낮게 설정하면 이 템플릿에만 별도 값이 저장됩니다."
        }
        onConfirm={onConfirmBelowDefaultRequiredCount}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            onCancelBelowDefaultRequiredCount();
          }
        }}
        open={pendingBelowDefaultRequiredCount !== null}
        title="기본 필수 인원보다 낮게 설정합니다"
      />

      <ConfirmDialog
        confirmLabel="삭제"
        description={
          pendingDeleteTemplate
            ? `"${pendingDeleteTemplate.name}" 템플릿을 삭제합니다. 이 작업은 되돌릴 수 없습니다.`
            : "선택한 템플릿을 삭제합니다. 이 작업은 되돌릴 수 없습니다."
        }
        onConfirm={onConfirmDelete}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            onCancelDelete();
          }
        }}
        open={pendingDeleteTemplate !== null}
        title="템플릿을 삭제할까요?"
      />
    </>
  );
}
