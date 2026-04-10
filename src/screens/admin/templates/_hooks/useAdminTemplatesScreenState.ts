import { useState } from "react";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import { useDeleteEventTemplateMutation } from "#/mutations/events/hooks/useDeleteEventTemplateMutation";
import { useEventTemplateCollectionState } from "#/queries/events/hooks/useEventTemplateCollectionState";
import {
  readTemplateDeleteErrorMessage,
  readTemplateListErrorMessage,
} from "#/screens/admin/templates/_helpers/templateError";

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
    templatesQuery,
  } = useEventTemplateCollectionState(initialHighlightedTemplateId);
  const [pendingDeleteTemplate, setPendingDeleteTemplate] =
    useState<EventTemplate | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteTemplateMutation = useDeleteEventTemplateMutation();
  const listError =
    deleteError ??
    (templatesQuery.error
      ? readTemplateListErrorMessage(templatesQuery.error)
      : null);

  function requestDelete(template: EventTemplate) {
    if (template.isPrimary) {
      return;
    }

    setDeleteError(null);
    setPendingDeleteTemplate(template);
  }

  async function confirmDelete() {
    if (!pendingDeleteTemplate) {
      return;
    }

    const template = pendingDeleteTemplate;
    setPendingDeleteTemplate(null);
    setDeleteError(null);

    try {
      await deleteTemplateMutation.mutateAsync({ id: template.id });

      if (highlightedTemplateId === template.id) {
        setHighlightedTemplateId(null);
      }
    } catch (error) {
      setDeleteError(readTemplateDeleteErrorMessage(error));
    }
  }

  function cancelDelete() {
    setPendingDeleteTemplate(null);
  }

  return {
    deletePending: deleteTemplateMutation.isPending,
    filteredTemplates,
    highlightedTemplateId,
    listError,
    onCancelDelete: cancelDelete,
    onConfirmDelete: confirmDelete,
    onDelete: requestDelete,
    onSearchTermChange: setSearchTerm,
    pendingDeleteTemplate,
    searchTerm,
  };
}
