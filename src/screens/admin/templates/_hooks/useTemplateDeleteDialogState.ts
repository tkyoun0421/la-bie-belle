import { useState } from "react";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import { useDeleteEventTemplateMutation } from "#/mutations/events/hooks/useDeleteEventTemplateMutation";
import { readTemplateDeleteErrorMessage } from "#/screens/admin/templates/_helpers/templateError";

type UseTemplateDeleteDialogStateOptions = {
  onDeleted?: (deletedTemplateId: string) => void;
};

export function useTemplateDeleteDialogState({
  onDeleted,
}: UseTemplateDeleteDialogStateOptions = {}) {
  const [templateToDelete, setTemplateToDelete] = useState<EventTemplate | null>(
    null
  );
  const deleteTemplateMutation = useDeleteEventTemplateMutation();
  const deleteError = deleteTemplateMutation.error
    ? readTemplateDeleteErrorMessage(deleteTemplateMutation.error)
    : null;

  function requestDelete(template: EventTemplate) {
    if (template.isPrimary) {
      return;
    }

    deleteTemplateMutation.reset();
    setTemplateToDelete(template);
  }

  async function confirmDelete() {
    if (!templateToDelete) {
      return;
    }

    const template = templateToDelete;
    setTemplateToDelete(null);

    try {
      await deleteTemplateMutation.mutateAsync({ id: template.id });
      onDeleted?.(template.id);
    } catch {
      // The mutation state is the source of truth for delete failures.
    }
  }

  function cancelDelete() {
    setTemplateToDelete(null);
    deleteTemplateMutation.reset();
  }

  return {
    deleteError,
    isDeletePending: deleteTemplateMutation.isPending,
    onCancelDelete: cancelDelete,
    onConfirmDelete: confirmDelete,
    onDelete: requestDelete,
    templateToDelete,
  };
}
