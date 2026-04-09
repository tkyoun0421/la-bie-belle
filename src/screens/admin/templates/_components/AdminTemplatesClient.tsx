"use client";

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
    editingTemplateId,
    error,
    filteredTemplates,
    formState,
    highlightedTemplateId,
    isEditorOpen,
    isSaving,
    onAddSlotRow,
    onCloseEditor,
    onDelete,
    onEdit,
    onFieldChange,
    onOpenChange,
    onOpenCreate,
    onRemoveSlotRow,
    onSearchTermChange,
    onSubmit,
    onUpdateSlot,
    positionOptions,
    searchTerm,
    slotRows,
  } = useAdminTemplatesScreenState();

  return (
    <>
      <section>
        <EventTemplatesListPanel
          deletePending={deletePending}
          editingTemplateId={editingTemplateId}
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
            템플릿 기본 정보와 슬롯 기본값을 입력하고 저장합니다.
          </DialogDescription>
          <EventTemplateEditorCard
            canManageSlots={positionOptions.length > 0}
            editingTemplateId={editingTemplateId}
            error={error}
            formState={formState}
            isSaving={isSaving}
            onAddSlotRow={onAddSlotRow}
            onCancel={onCloseEditor}
            onFieldChange={onFieldChange}
            onRemoveSlotRow={onRemoveSlotRow}
            onSubmit={onSubmit}
            onUpdateSlot={onUpdateSlot}
            positionOptions={positionOptions}
            slotRows={slotRows}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
