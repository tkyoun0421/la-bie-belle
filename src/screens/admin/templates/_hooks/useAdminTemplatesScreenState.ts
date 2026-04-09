import { useState } from "react";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import { useDeleteEventTemplateMutation } from "#/mutations/events/hooks/useDeleteEventTemplateMutation";
import { useEventTemplateCollectionState } from "#/queries/events/hooks/useEventTemplateCollectionState";

type UseAdminTemplatesScreenStateOptions = {
  initialHighlightedTemplateId: string | null;
};

export function useAdminTemplatesScreenState({
  initialHighlightedTemplateId,
}: UseAdminTemplatesScreenStateOptions) {
  const {
    filteredTemplates,
    highlightedTemplateId,
    searchTerm,
    setHighlightedTemplateId,
    setSearchTerm,
  } = useEventTemplateCollectionState(initialHighlightedTemplateId);
  const [pendingDeleteTemplate, setPendingDeleteTemplate] =
    useState<EventTemplate | null>(null);
  const deleteTemplateMutation = useDeleteEventTemplateMutation();

  function requestDelete(template: EventTemplate) {
    if (template.isPrimary) {
      return;
    }

    setPendingDeleteTemplate(template);
  }

  async function confirmDelete() {
    if (!pendingDeleteTemplate) {
      return;
    }

    const template = pendingDeleteTemplate;
    setPendingDeleteTemplate(null);

    await deleteTemplateMutation.mutateAsync({ id: template.id });

    if (highlightedTemplateId === template.id) {
      setHighlightedTemplateId(null);
    }
  }

  function cancelDelete() {
    setPendingDeleteTemplate(null);
  }

  return {
    deletePending: deleteTemplateMutation.isPending,
    filteredTemplates,
    highlightedTemplateId,
    onCancelDelete: cancelDelete,
    onConfirmDelete: confirmDelete,
    onDelete: requestDelete,
    onSearchTermChange: setSearchTerm,
    pendingDeleteTemplate,
    searchTerm,
  };
}
