import { useMemo } from "react";
import type { Position } from "#/entities/positions/models/schemas/position";
import { useEventTemplateCollectionState } from "#/queries/events/hooks/useEventTemplateCollectionState";
import { usePositionsQuery } from "#/queries/positions/hooks/usePositionsQuery";
import {
  createDefaultTemplateFormValues,
  createPositionDefaultRequiredCountMap,
  createPositionNameMap,
  createTemplatePositionOptions,
} from "#/screens/admin/templates/_helpers/templateForm";
import { useTemplateEditorState } from "#/screens/admin/templates/_hooks/useTemplateEditorState";

const emptyPositions: Position[] = [];

export function useAdminTemplatesScreenState() {
  const positions = usePositionsQuery().data ?? emptyPositions;
  const {
    filteredTemplates,
    highlightedTemplateId,
    searchTerm,
    setHighlightedTemplateId,
    setSearchTerm,
    templates,
  } = useEventTemplateCollectionState();
  const defaultPositionId = positions[0]?.id ?? "";
  const defaultRequiredCount = positions[0]?.defaultRequiredCount ?? 2;
  const positionIds = useMemo(
    () => positions.map((position) => position.id),
    [positions]
  );
  const defaultRequiredCountByPositionId = useMemo(
    () => createPositionDefaultRequiredCountMap(positions),
    [positions]
  );
  const positionNameById = useMemo(
    () => createPositionNameMap(positions),
    [positions]
  );
  const positionOptions = useMemo(
    () => createTemplatePositionOptions(positions),
    [positions]
  );
  const defaultTemplateValues = useMemo(
    () =>
      createDefaultTemplateFormValues(
        positions,
        defaultPositionId,
        defaultRequiredCount,
        templates.length === 0
      ),
    [positions, defaultPositionId, defaultRequiredCount, templates.length]
  );
  const editorState = useTemplateEditorState({
    defaultPositionId,
    defaultRequiredCount,
    defaultRequiredCountByPositionId,
    defaultTemplateValues,
    highlightedTemplateId,
    positionIds,
    positionNameById,
    setHighlightedTemplateId,
    setSearchTerm,
    templates,
  });

  return {
    deletePending: editorState.deletePending,
    draggingSlotKey: editorState.draggingSlotKey,
    dropTargetSlotKey: editorState.dropTargetSlotKey,
    editingTemplateId: editorState.editingTemplateId,
    error: editorState.error,
    filteredTemplates,
    formState: editorState.formState,
    highlightedTemplateId,
    isEditorOpen: editorState.isEditorOpen,
    isPrimaryLocked: editorState.isPrimaryLocked,
    isSaving: editorState.isSaving,
    onAddSlotRow: editorState.addSlotRow,
    onCancelBelowDefaultRequiredCount:
      editorState.cancelBelowDefaultRequiredCount,
    onCancelDelete: editorState.cancelRemove,
    onCloseEditor: editorState.closeEditor,
    onConfirmBelowDefaultRequiredCount:
      editorState.confirmBelowDefaultRequiredCount,
    onConfirmDelete: editorState.confirmRemove,
    onDelete: editorState.remove,
    onEdit: editorState.startEdit,
    onFieldChange: editorState.updateField,
    onOpenChange: editorState.onOpenChange,
    onOpenCreate: editorState.openCreate,
    onPrimaryChange: editorState.updatePrimary,
    onRemoveSlotRow: editorState.removeSlotRow,
    onSearchTermChange: setSearchTerm,
    onSlotDragEnd: editorState.clearSlotDragState,
    onSlotDragStart: editorState.startSlotDrag,
    onSlotDrop: editorState.dropOnSlot,
    onSlotDropTargetChange: editorState.setSlotDropTarget,
    onSubmit: editorState.submit,
    onUpdateSlot: editorState.updateSlot,
    pendingDeleteTemplate: editorState.pendingDeleteTemplate,
    pendingBelowDefaultRequiredCount:
      editorState.pendingBelowDefaultRequiredCount,
    positionOptions,
    searchTerm,
    slotRows: editorState.slotRows,
  };
}
