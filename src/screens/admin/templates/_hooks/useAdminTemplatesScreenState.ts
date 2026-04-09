import {
  createPositionDefaultRequiredCountMap,
  createTemplatePositionOptions,
} from "#/screens/admin/templates/_helpers/templateForm";
import { useTemplateEditorState } from "#/screens/admin/templates/_hooks/useTemplateEditorState";
import { useEventTemplateCollectionState } from "#/queries/events/hooks/useEventTemplateCollectionState";
import { usePositionsQuery } from "#/queries/positions/hooks/usePositionsQuery";

export function useAdminTemplatesScreenState() {
  const positions = usePositionsQuery().data ?? [];
  const {
    filteredTemplates,
    highlightedTemplateId,
    searchTerm,
    setHighlightedTemplateId,
    setSearchTerm,
  } = useEventTemplateCollectionState();
  const defaultPositionId = positions[0]?.id ?? "";
  const defaultRequiredCount = positions[0]?.defaultRequiredCount ?? 2;
  const defaultRequiredCountByPositionId =
    createPositionDefaultRequiredCountMap(positions);
  const positionOptions = createTemplatePositionOptions(positions);
  const editorState = useTemplateEditorState({
    defaultPositionId,
    defaultRequiredCount,
    defaultRequiredCountByPositionId,
    highlightedTemplateId,
    setHighlightedTemplateId,
    setSearchTerm,
  });

  return {
    deletePending: editorState.deletePending,
    editingTemplateId: editorState.editingTemplateId,
    error: editorState.error,
    filteredTemplates,
    formState: editorState.formState,
    highlightedTemplateId,
    isEditorOpen: editorState.isEditorOpen,
    isSaving: editorState.isSaving,
    onAddSlotRow: editorState.addSlotRow,
    onCloseEditor: editorState.closeEditor,
    onDelete: editorState.remove,
    onEdit: editorState.startEdit,
    onFieldChange: editorState.updateField,
    onOpenChange: editorState.onOpenChange,
    onOpenCreate: editorState.openCreate,
    onRemoveSlotRow: editorState.removeSlotRow,
    onSearchTermChange: setSearchTerm,
    onSubmit: editorState.submit,
    onUpdateSlot: editorState.updateSlot,
    positionOptions,
    searchTerm,
    slotRows: editorState.slotRows,
  };
}
