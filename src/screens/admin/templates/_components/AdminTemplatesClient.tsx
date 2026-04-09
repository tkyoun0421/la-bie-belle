"use client";

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
    isSaving,
    onAddSlotRow,
    onCancel,
    onDelete,
    onEdit,
    onFieldChange,
    onRemoveSlotRow,
    onSearchTermChange,
    onSubmit,
    onUpdateSlot,
    positionOptions,
    searchTerm,
    slotRows,
  } = useAdminTemplatesScreenState();

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <EventTemplateEditorCard
        canManageSlots={positionOptions.length > 0}
        editingTemplateId={editingTemplateId}
        error={error}
        formState={formState}
        isSaving={isSaving}
        onAddSlotRow={onAddSlotRow}
        onCancel={onCancel}
        onFieldChange={onFieldChange}
        onRemoveSlotRow={onRemoveSlotRow}
        onSubmit={onSubmit}
        onUpdateSlot={onUpdateSlot}
        positionOptions={positionOptions}
        slotRows={slotRows}
      />

      <EventTemplatesListPanel
        deletePending={deletePending}
        editingTemplateId={editingTemplateId}
        highlightedTemplateId={highlightedTemplateId}
        onDelete={onDelete}
        onEdit={onEdit}
        onSearchTermChange={onSearchTermChange}
        searchTerm={searchTerm}
        templates={filteredTemplates}
      />
    </section>
  );
}
