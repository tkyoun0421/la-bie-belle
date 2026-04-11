"use client";

import { Alert, AlertDescription, AlertTitle } from "#/shared/components/ui/alert";
import { ConfirmDialog } from "#/shared/components/common/ConfirmDialog";
import { EventTemplatesListPanel } from "#/screens/admin/templates/_components/EventTemplatesListPanel";
import { useAdminTemplatesScreenState } from "#/screens/admin/templates/_hooks/useAdminTemplatesScreenState";
import { useTemplateDeleteDialogState } from "#/screens/admin/templates/_hooks/useTemplateDeleteDialogState";

type AdminTemplatesClientProps = {
  initialHighlightedTemplateId: string | null;
};

export function AdminTemplatesClient({
  initialHighlightedTemplateId,
}: Readonly<AdminTemplatesClientProps>) {
  const {
    clearHighlightedTemplate,
    filteredTemplates,
    highlightedTemplateId,
    onSearchTermChange,
    queryError,
    searchTerm,
  } = useAdminTemplatesScreenState({
    initialHighlightedTemplateId,
  });
  const {
    deleteError,
    isDeletePending,
    onCancelDelete,
    onConfirmDelete,
    onDelete,
    templateToDelete,
  } = useTemplateDeleteDialogState({
    onDeleted(deletedTemplateId) {
      if (highlightedTemplateId === deletedTemplateId) {
        clearHighlightedTemplate();
      }
    },
  });

  return (
    <>
      <section className="grid gap-4">
        {deleteError ? (
          <Alert variant="destructive">
            <AlertTitle>템플릿을 삭제할 수 없습니다</AlertTitle>
            <AlertDescription>{deleteError}</AlertDescription>
          </Alert>
        ) : null}

        <EventTemplatesListPanel
          deletePending={isDeletePending}
          highlightedTemplateId={highlightedTemplateId}
          onDelete={onDelete}
          onSearchTermChange={onSearchTermChange}
          queryError={queryError}
          searchTerm={searchTerm}
          templates={filteredTemplates}
        />
      </section>

      <ConfirmDialog
        confirmLabel="삭제"
        description={
          templateToDelete
            ? `"${templateToDelete.name}" 템플릿을 삭제합니다. 이 작업은 되돌릴 수 없습니다.`
            : "선택한 템플릿을 삭제합니다. 이 작업은 되돌릴 수 없습니다."
        }
        onConfirm={onConfirmDelete}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            onCancelDelete();
          }
        }}
        open={templateToDelete !== null}
        title="템플릿을 삭제할까요?"
      />
    </>
  );
}
