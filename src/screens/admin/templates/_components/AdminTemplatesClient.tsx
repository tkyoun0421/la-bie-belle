"use client";

import { EventTemplateEditorCard } from "#/screens/admin/templates/_components/EventTemplateEditorCard";
import { EventTemplatesListPanel } from "#/screens/admin/templates/_components/EventTemplatesListPanel";
import { useEventTemplateEditorState } from "#/mutations/events/hooks/useEventTemplateEditorState";
import { useEventTemplateCollectionState } from "#/queries/events/hooks/useEventTemplateCollectionState";
import { usePositionsQuery } from "#/queries/positions/hooks/usePositionsQuery";
import { formatPositionAllowedGenderLabel } from "#/entities/positions/models/constants/allowedGender";

export function AdminTemplatesClient() {
  const positionsQuery = usePositionsQuery();
  const positions = positionsQuery.data ?? [];
  const {
    filteredTemplates,
    highlightedTemplateId,
    searchTerm,
    setHighlightedTemplateId,
    setSearchTerm,
  } = useEventTemplateCollectionState();
  const {
    addSlotRow,
    deleteTemplateMutation,
    editingTemplateId,
    formError,
    formState,
    isSaving,
    remove,
    removeSlotRow,
    resetForm,
    startEdit,
    submit,
    updateField,
    updateSlot,
  } = useEventTemplateEditorState({
    defaultPositionId: positions[0]?.id ?? "",
    onDeleted(deletedTemplateId) {
      if (highlightedTemplateId === deletedTemplateId) {
        setHighlightedTemplateId(null);
      }
    },
    onSaved(template) {
      setSearchTerm("");
      setHighlightedTemplateId(template.id);
    },
  });
  const positionOptions = positions.map((position) => ({
    label: `${position.name} - ${formatPositionAllowedGenderLabel(position.allowedGender)}`,
    value: position.id,
  }));

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <EventTemplateEditorCard
        canManageSlots={positions.length > 0}
        editingTemplateId={editingTemplateId}
        error={formError}
        formState={formState}
        isSaving={isSaving}
        onAddSlotRow={addSlotRow}
        onCancel={resetForm}
        onFieldChange={updateField}
        onRemoveSlotRow={removeSlotRow}
        onSubmit={submit}
        onUpdateSlot={updateSlot}
        positionOptions={positionOptions}
      />

      <EventTemplatesListPanel
        deletePending={deleteTemplateMutation.isPending}
        editingTemplateId={editingTemplateId}
        highlightedTemplateId={highlightedTemplateId}
        onDelete={remove}
        onEdit={(template) => {
          setHighlightedTemplateId(template.id);
          startEdit(template);
        }}
        onSearchTermChange={setSearchTerm}
        searchTerm={searchTerm}
        templates={filteredTemplates}
      />
    </section>
  );
}
